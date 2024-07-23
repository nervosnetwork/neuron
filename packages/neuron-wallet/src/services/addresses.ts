import { hd } from '@ckb-lumos/lumos'
import { publicKeyToAddress, DefaultAddressNumber } from '../utils/scriptAndAddress'
import { Address as AddressInterface } from '../models/address'
import AddressCreatedSubject from '../models/subjects/address-created-subject'
import NetworksService from '../services/networks'
import AddressParser from '../models/address-parser'
import { getConnection } from '../database/chain/connection'
import { TransactionsService } from '../services/tx'
import CellsService from './cells'
import SystemScriptInfo from '../models/system-script-info'
import Script from '../models/chain/script'
import HdPublicKeyInfo from '../database/chain/entities/hd-public-key-info'
import AddressDescription from '../database/chain/entities/address-description'
import AddressDbChangedSubject from '../models/subjects/address-db-changed-subject'
import AddressMeta from '../database/address/meta'
import queueWrapper from '../utils/queue'

const MAX_ADDRESS_COUNT = 100

export interface AddressMetaInfo {
  walletId: string
  addressType: hd.AddressType
  addressIndex: number
  accountExtendedPublicKey: hd.AccountExtendedPublicKey
}

export default class AddressService {
  private static minUnusedAddressCount: number = 3

  public static generateAndSaveForPublicKeyQueue = queueWrapper(AddressService.generateAndSaveForPublicKey)

  public static generateAndSaveForExtendedKeyQueue = queueWrapper(AddressService.generateAndSaveForExtendedKey)

  private static async create({ addresses }: { addresses: AddressInterface[] }) {
    const walletIds = new Set(addresses.map(v => v.walletId))
    if (walletIds.size !== 1) {
      throw new Error('Addresses can only be created for one wallet at a time')
    }
    const walletAddresses = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({ walletId: [...walletIds.values()][0] })
      .getMany()
    const publicKeyInBlake160Array: string[] = walletAddresses.map(v => v.publicKeyInBlake160)
    const publicKeyInfos = addresses
      .filter(v => !publicKeyInBlake160Array?.includes(v.blake160))
      .map(addr => {
        return HdPublicKeyInfo.fromObject({
          ...addr,
          publicKeyInBlake160: addr.blake160,
        })
      })
    if (publicKeyInfos.length) {
      await getConnection().manager.save(publicKeyInfos)
      AddressDbChangedSubject.getSubject().next('Updated')
    }
  }

  private static async generateAndSave(
    walletId: string,
    extendedKey: hd.AccountExtendedPublicKey,
    receivingStartIndex: number,
    changeStartIndex: number,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ) {
    const addresses = AddressService.generateAddresses(
      walletId,
      extendedKey,
      receivingStartIndex,
      changeStartIndex,
      receivingAddressCount,
      changeAddressCount
    )

    const generatedAddresses: AddressInterface[] = [...addresses.receiving, ...addresses.change]
    await AddressService.create({ addresses: generatedAddresses })
    return generatedAddresses
  }

  private static notifyAddressCreated = (addresses: AddressInterface[], isImporting: boolean | undefined) => {
    const addressesToNotify = addresses.map(address => ({ ...address, isImporting }))

    if (process.send) {
      process.send({ channel: 'address-created', message: addressesToNotify })
    } else {
      AddressCreatedSubject.getSubject().next(addressesToNotify)
    }
  }

  private static async recursiveGenerateAndSave(
    walletId: string,
    extendedKey: hd.AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ): Promise<AddressInterface[] | undefined> {
    const [receivingCount, changeCount] = await this.getAddressCountsToFillGapLimit(
      walletId,
      receivingAddressCount,
      changeAddressCount
    )
    if (!receivingCount && !changeCount) return undefined
    const maxReceivingAddressIndex = await this.maxAddressIndex(walletId, hd.AddressType.Receiving)
    const maxChangeAddressIndex = await this.maxAddressIndex(walletId, hd.AddressType.Change)
    const nextReceivingIndex = maxReceivingAddressIndex === undefined ? 0 : maxReceivingAddressIndex + 1
    const nextChangeIndex = maxChangeAddressIndex === undefined ? 0 : maxChangeAddressIndex + 1

    const currentGeneratedAddresses = await this.generateAndSave(
      walletId,
      extendedKey,
      nextReceivingIndex,
      nextChangeIndex,
      receivingCount,
      changeCount
    )

    // recursive check and generate addresses
    const nextGeneratedAddresses = await this.recursiveGenerateAndSave(
      walletId,
      extendedKey,
      isImporting,
      receivingAddressCount,
      changeAddressCount
    )

    const allGeneratedAddresses = currentGeneratedAddresses

    if (nextGeneratedAddresses) {
      allGeneratedAddresses.push(...nextGeneratedAddresses)
    }

    allGeneratedAddresses.sort((lhs, rhs) => {
      return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
    })

    return allGeneratedAddresses
  }

  public static async getAddressCountsToFillGapLimit(
    walletId: string,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ) {
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    const unusedReceivingCount = unusedReceivingAddresses.length
    const unusedChangeCount = unusedChangeAddresses.length
    return [
      unusedReceivingCount > this.minUnusedAddressCount ? 0 : receivingAddressCount,
      unusedChangeCount > this.minUnusedAddressCount ? 0 : changeAddressCount,
    ]
  }

  public static async generateAndSaveForExtendedKey({
    walletId,
    extendedKey,
    isImporting,
    receivingAddressCount,
    changeAddressCount,
  }: {
    walletId: string
    extendedKey: hd.AccountExtendedPublicKey
    isImporting?: boolean
    receivingAddressCount?: number
    changeAddressCount?: number
  }) {
    const generatedAddresses = await AddressService.recursiveGenerateAndSave(
      walletId,
      extendedKey,
      isImporting,
      receivingAddressCount ?? DefaultAddressNumber.Receiving,
      changeAddressCount ?? DefaultAddressNumber.Change
    )

    if (generatedAddresses) {
      AddressService.notifyAddressCreated(generatedAddresses, isImporting)
    }

    return generatedAddresses
  }

  private static async generateAndSaveForPublicKey({
    walletId,
    publicKey,
    addressType,
    addressIndex,
  }: {
    walletId: string
    publicKey: string
    addressType: hd.AddressType
    addressIndex: number
  }): Promise<AddressInterface | undefined> {
    const isMainnet = NetworksService.getInstance().isMainnet()
    const address = publicKeyToAddress(publicKey, isMainnet)
    const publicKeyHash = AddressParser.toBlake160(address)

    const exist = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({
        walletId,
        publicKeyInBlake160: publicKeyHash,
      })
      .getRawOne()

    if (exist) {
      return
    }

    const publicKeyInfo = HdPublicKeyInfo.fromObject({
      walletId,
      addressType,
      addressIndex,
      publicKeyInBlake160: publicKeyHash,
    })

    await getConnection().manager.save(publicKeyInfo)

    const addressMeta = AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo.toModel())
    AddressService.notifyAddressCreated([addressMeta], undefined)
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    walletId: string,
    extendedKey: hd.AccountExtendedPublicKey,
    receivingStartIndex: number,
    changeStartIndex: number,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change
  ) => {
    // can be only receiving OR only change
    if (receivingAddressCount < 1 && changeAddressCount < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressCount > MAX_ADDRESS_COUNT || changeAddressCount > MAX_ADDRESS_COUNT) {
      throw new Error('Address number error.')
    }
    const receiving = Array.from({ length: receivingAddressCount }).map((_, idx) => {
      const addressMetaInfo: AddressMetaInfo = {
        walletId,
        addressType: hd.AddressType.Receiving,
        addressIndex: idx + receivingStartIndex,
        accountExtendedPublicKey: extendedKey,
      }
      return AddressService.toAddress(addressMetaInfo)
    })
    const change = Array.from({ length: changeAddressCount }).map((_, idx) => {
      const addressMetaInfo: AddressMetaInfo = {
        walletId,
        addressType: hd.AddressType.Change,
        addressIndex: idx + changeStartIndex,
        accountExtendedPublicKey: extendedKey,
      }
      return AddressService.toAddress(addressMetaInfo)
    })
    return {
      receiving,
      change,
    }
  }

  private static toAddress = (addressMetaInfo: AddressMetaInfo): AddressInterface => {
    const info = addressMetaInfo.accountExtendedPublicKey.publicKeyInfo(
      addressMetaInfo.addressType,
      addressMetaInfo.addressIndex
    )

    const address: AddressInterface = {
      walletId: addressMetaInfo.walletId,
      address: publicKeyToAddress(info.publicKey, NetworksService.getInstance().isMainnet()),
      path: info.path,
      addressType: addressMetaInfo.addressType,
      addressIndex: addressMetaInfo.addressIndex,
      blake160: info.blake160,
    }

    return address
  }

  private static async maxAddressIndex(walletId: string, addressType: hd.AddressType): Promise<number | undefined> {
    const result = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .select('addressIndex')
      .where({ walletId, addressType })
      .orderBy('addressIndex', 'DESC')
      .getRawOne()

    if (!result) {
      return undefined
    }

    return result.addressIndex
  }

  private static async getGroupedUnusedAddressesByWalletId(walletId: string) {
    const allUnusedAddresses = await this.getUnusedAddressesByWalletId(walletId)

    const unusedReceivingAddresses = allUnusedAddresses.filter(addr => addr.addressType === hd.AddressType.Receiving)
    const unusedChangeAddresses = allUnusedAddresses.filter(addr => addr.addressType === hd.AddressType.Change)

    return [unusedReceivingAddresses, unusedChangeAddresses]
  }

  private static async getUnusedAddressesByWalletId(walletId: string) {
    const txCountsByLockArgs = await TransactionsService.getTxCountsByWalletId(walletId)

    const addresses = await this.getAddressesByWalletId(walletId)
    for (const address of addresses) {
      const txCount = txCountsByLockArgs.get(address.blake160)

      if (!txCount) {
        continue
      }
      address.txCount = txCount
    }

    const allUnusedAddresses = addresses.filter(address => !address.txCount)

    return allUnusedAddresses
  }

  public static async getNextUnusedAddressByWalletId(walletId: string): Promise<AddressInterface | undefined> {
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    if (unusedReceivingAddresses.length) {
      return unusedReceivingAddresses[0]
    }
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }

    return undefined
  }

  public static async getNextUnusedChangeAddressByWalletId(walletId: string): Promise<AddressInterface | undefined> {
    const [, unusedChangeAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }
    return undefined
  }

  public static async getUnusedReceivingAddressesByWalletId(walletId: string): Promise<AddressInterface[]> {
    const [unusedReceivingAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    return unusedReceivingAddresses
  }

  public static getFirstAddressByWalletId = async (walletId: string): Promise<AddressInterface> => {
    const publicKeyInfo = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({ walletId, addressType: hd.AddressType.Receiving })
      .orderBy('addressIndex', 'ASC')
      .getOne()

    return AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo!.toModel())
  }

  public static getAddressesByAllWallets = async (): Promise<AddressInterface[]> => {
    const publicKeyInfos = await getConnection().getRepository(HdPublicKeyInfo).createQueryBuilder().getMany()

    return publicKeyInfos.map(publicKeyInfo => AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo.toModel()))
  }

  public static async getAddressesByWalletId(walletId: string): Promise<AddressInterface[]> {
    const publicKeyInfos = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({ walletId })
      .getMany()

    const addressDescriptions = await getConnection()
      .getRepository(AddressDescription)
      .createQueryBuilder()
      .where({ walletId })
      .getMany()

    return publicKeyInfos
      .sort((lhs, rhs) => {
        return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
      })
      .map(publicKeyInfo => {
        const keyInfoModel = AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo.toModel())
        const found = addressDescriptions.find(addrDesc => addrDesc.address === keyInfoModel.address)
        keyInfoModel.description = found?.description
        return keyInfoModel
      })
  }

  public static async getAddressesWithBalancesByWalletId(walletId: string): Promise<AddressInterface[]> {
    const addresses = await this.getAddressesByWalletId(walletId)
    const { liveBalances, sentBalances, pendingBalances } = await CellsService.getBalancesByWalletId(walletId)
    const txCountsByLock = await TransactionsService.getTxCountsByWalletId(walletId, {
      codeHash: SystemScriptInfo.SECP_CODE_HASH,
      hashType: SystemScriptInfo.SECP_HASH_TYPE,
    })
    const allAddressesWithBalances = addresses.map(address => {
      const script = Script.fromObject({
        codeHash: SystemScriptInfo.SECP_CODE_HASH,
        hashType: SystemScriptInfo.SECP_HASH_TYPE,
        args: address.blake160,
      })
      const lockHash = script.computeHash()
      const liveBalance = liveBalances.get(lockHash) || '0'
      const sentBalance = sentBalances.get(lockHash) || '0'
      const pendingBalance = pendingBalances.get(lockHash) || '0'
      const balance = (BigInt(liveBalance) + BigInt(sentBalance)).toString()

      const txCount = txCountsByLock.get(address.blake160) || 0

      return {
        ...address,
        liveBalance,
        sentBalance,
        pendingBalance,
        balance,
        txCount,
      }
    })
    return allAddressesWithBalances
  }

  public static async updateDescription(walletId: string, address: string, description: string) {
    const addressDescription = await getConnection()
      .getRepository(AddressDescription)
      .createQueryBuilder()
      .where({ walletId, address })
      .getOne()

    if (addressDescription) {
      addressDescription.description = description
      await getConnection().manager.save(addressDescription)

      return
    }

    await getConnection()
      .getRepository(AddressDescription)
      .createQueryBuilder()
      .insert()
      .values({ walletId, address, description })
      .execute()
  }

  public static async deleteByWalletId(walletId: string): Promise<void> {
    await getConnection().createQueryBuilder().delete().from(HdPublicKeyInfo).where({ walletId }).execute()
  }
}
