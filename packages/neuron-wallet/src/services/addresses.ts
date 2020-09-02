import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey, DefaultAddressNumber } from 'models/keys/key'
import Address, { AddressType } from 'models/keys/address'
import { Address as AddressInterface, AddressVersion } from "models/address"
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import NetworksService from 'services/networks'
import AddressParser from 'models/address-parser'
import { getConnection } from 'typeorm'
import { TransactionsService } from 'services/tx'
import CellsService from './cells'
import SystemScriptInfo from 'models/system-script-info'
import Script from 'models/chain/script'
import HdPublicKeyInfo from 'database/chain/entities/hd-public-key-info'
import { ChildProcess } from 'utils/worker'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import AddressMeta from 'database/address/meta'

const MAX_ADDRESS_COUNT = 100

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  private static minUnusedAddressCount: number = 3

  private static async create (addresses: AddressInterface[]) {
    const publicKeyInfos = addresses.map(addr => {
      return HdPublicKeyInfo.fromObject({
        ...addr,
        publicKeyInBlake160: addr.blake160
      })
    })
    await getConnection().manager.save(publicKeyInfos)
    AddressDbChangedSubject.getSubject().next("Updated")
  }

  private static async generateAndSave(
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
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


    const generatedAddresses: AddressInterface[] = [
      ...addresses.receiving,
      ...addresses.change,
    ]
    await this.create(generatedAddresses)

    return generatedAddresses
  }

  private static notifyAddressCreated = (addresses: AddressInterface[], isImporting: boolean | undefined) => {
    const addressesToNotify = addresses
      .map(address => ({ ...address, isImporting }))

    if (ChildProcess.isChildProcess()) {
      ChildProcess.send({
        channel: 'address-created',
        result: addressesToNotify
      })
    } else {
      AddressCreatedSubject.getSubject().next(addressesToNotify)
    }
  }

  public static async checkAndGenerateSave(
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
    isImporting: boolean | undefined,
    receivingAddressCount: number = DefaultAddressNumber.Receiving,
    changeAddressCount: number = DefaultAddressNumber.Change,
    notifyAddressCreated: boolean = true
  ): Promise<AddressInterface[] | undefined> {
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    const unusedReceivingCount = unusedReceivingAddresses.length
    const unusedChangeCount = unusedChangeAddresses.length
    if (
      unusedReceivingCount > this.minUnusedAddressCount &&
      unusedChangeCount > this.minUnusedAddressCount
    ) {
      return undefined
    }
    const maxReceivingAddressIndex = await this.maxAddressIndex(walletId, AddressType.Receiving)
    const maxChangeAddressIndex = await this.maxAddressIndex(walletId, AddressType.Change)
    const nextReceivingIndex = maxReceivingAddressIndex === undefined ? 0 : maxReceivingAddressIndex + 1
    const nextChangeIndex = maxChangeAddressIndex === undefined ? 0 : maxChangeAddressIndex + 1

    const receivingCount: number = unusedReceivingCount > this.minUnusedAddressCount ? 0 : receivingAddressCount
    const changeCount: number = unusedChangeCount > this.minUnusedAddressCount ? 0 : changeAddressCount

    const currentGeneratedAddresses = await this.generateAndSave(
      walletId,
      extendedKey,
      nextReceivingIndex,
      nextChangeIndex,
      receivingCount,
      changeCount
    )

    //resursive check and generate addresses
    const nextGeneratedAddresses = await this.checkAndGenerateSave(
      walletId,
      extendedKey,
      isImporting,
      receivingAddressCount,
      changeAddressCount,
      false
    )

    const allGeneratedAddresses = currentGeneratedAddresses

    if (nextGeneratedAddresses) {
      allGeneratedAddresses.push(...nextGeneratedAddresses)
    }

    allGeneratedAddresses.sort((lhs, rhs) => {
      return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
    })

    if (notifyAddressCreated) {
      this.notifyAddressCreated(allGeneratedAddresses, isImporting)
    }

    return allGeneratedAddresses
  }

  // Generate both receiving and change addresses.
  public static generateAddresses = (
    walletId: string,
    extendedKey: AccountExtendedPublicKey,
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
        addressType: AddressType.Receiving,
        addressIndex: idx + receivingStartIndex,
        accountExtendedPublicKey: extendedKey,
      }
      return AddressService.toAddress(addressMetaInfo)
    })
    const change = Array.from({ length: changeAddressCount }).map((_, idx) => {
      const addressMetaInfo: AddressMetaInfo = {
        walletId,
        addressType: AddressType.Change,
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
    const path: string = Address.pathFor(addressMetaInfo.addressType, addressMetaInfo.addressIndex)
    const address: string = addressMetaInfo.accountExtendedPublicKey.address(
      addressMetaInfo.addressType,
      addressMetaInfo.addressIndex,
      AddressService.getAddressPrefix()
    ).address

    const blake160: string = AddressParser.toBlake160(address)

    const addressInfo: AddressInterface = {
      walletId: addressMetaInfo.walletId,
      address,
      path,
      addressType: addressMetaInfo.addressType,
      addressIndex: addressMetaInfo.addressIndex,
      blake160
    }

    return addressInfo
  }

  private static async maxAddressIndex(walletId: string, addressType: AddressType): Promise<number | undefined> {
    const result = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .select('addressIndex')
      .where({walletId, addressType})
      .orderBy('addressIndex', 'DESC')
      .getRawOne()

    if (!result) {
      return undefined
    }

    return result.addressIndex
  }

  private static async getGroupedUnusedAddressesByWalletId(walletId: string) {
    const allUnusedAddresses = await this.getUnusedAddressesByWalletId(walletId)

    const unusedReceivingAddresses = allUnusedAddresses
      .filter(addr => addr.addressType === AddressType.Receiving)
    const unusedChangeAddresses = allUnusedAddresses
      .filter(addr => addr.addressType === AddressType.Change)

    return [unusedReceivingAddresses, unusedChangeAddresses]
  }

  private static async getUnusedAddressesByWalletId (walletId: string) {
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

  public static async getNextUnusedAddressByWalletId (walletId: string): Promise<AddressInterface | undefined> {
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    if (unusedReceivingAddresses.length) {
      return unusedReceivingAddresses[0]
    }
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }

    return undefined
  }

  public static async getNextUnusedChangeAddressByWalletId (walletId: string): Promise<AddressInterface | undefined> {
    const [ , unusedChangeAddresses ] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }
    return undefined
  }

  public static async getUnusedReceivingAddressesByWalletId(walletId: string): Promise<AddressInterface[]> {
    const [ unusedReceivingAddresses ] = await this.getGroupedUnusedAddressesByWalletId(walletId)
    return unusedReceivingAddresses
  }


  public static getAddressesByAllWallets = async (): Promise<AddressInterface[]> => {
    const publicKeyInfos = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .getMany()

    return publicKeyInfos
      .map(publicKeyInfo => (
        AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo.toModel())
      ))
  }

  public static async getAddressesByWalletId (walletId: string): Promise<AddressInterface[]> {
    const publicKeyInfos = await getConnection()
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .where({walletId})
      .getMany()

    return publicKeyInfos.sort((lhs, rhs) => {
        return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
      })
      .map(publicKeyInfo => (
        AddressMeta.fromHdPublicKeyInfoModel(publicKeyInfo.toModel()))
      )
  }

  public static async getAddressesWithBalancesByWalletId (walletId: string): Promise<AddressInterface[]> {
    const addresses = await this.getAddressesByWalletId(walletId)
    const {liveBalances, sentBalances, pendingBalances} = await CellsService.getBalancesByWalletId(walletId)
    const txCountsByLockArgs = await TransactionsService.getTxCountsByWalletId(walletId)
    const allAddressesWithBalances = addresses.map(address => {
      const script = Script.fromObject({
        codeHash: SystemScriptInfo.SECP_CODE_HASH,
        hashType: SystemScriptInfo.SECP_HASH_TYPE,
        args: address.blake160
      });
      const lockHash = script.computeHash()
      const liveBalance = liveBalances.get(lockHash) || '0'
      const sentBalance = sentBalances.get(lockHash) || '0'
      const pendingBalance = pendingBalances.get(lockHash) || '0'
      const balance = (BigInt(liveBalance) + BigInt(sentBalance)).toString()

      const txCount = txCountsByLockArgs.get(address.blake160) || 0

      return {
        ...address,
        liveBalance,
        sentBalance,
        pendingBalance,
        balance,
        txCount
      }
    })
    return allAddressesWithBalances
  }

  public static async updateDescription (walletId: string, address: string, description: string) {
    await getConnection()
      .createQueryBuilder()
      .update(HdPublicKeyInfo)
      .set({
        description
      })
      .where({
        walletId,
        address
      })
      .execute()
  }

  public static async deleteByWalletId (walletId: string): Promise<void> {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(HdPublicKeyInfo)
      .where({walletId})
      .execute()
  }

  private static getAddressVersion = (): AddressVersion => {
    return NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
  }

  private static getAddressPrefix() : AddressPrefix {
    return this.getAddressVersion() === AddressVersion.Mainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet
  }
}
