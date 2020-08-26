import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { AccountExtendedPublicKey, DefaultAddressNumber } from 'models/keys/key'
import Address, { AddressType } from 'models/keys/address'
import AddressDao, { Address as AddressInterface, AddressVersion } from 'database/address/address-dao'
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

const MAX_ADDRESS_COUNT = 100

export interface AddressMetaInfo {
  walletId: string
  addressType: AddressType
  addressIndex: number
  accountExtendedPublicKey: AccountExtendedPublicKey
}

export default class AddressService {
  private static minUnusedAddressCount: number = 3

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
    await AddressDao.create(generatedAddresses)

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
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getUnusedAddresses(walletId)
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

  private static async getUnusedAddresses(walletId: string) {
    const allUnusedAddresses = await this.getAllUnusedAddressesByWalletId(walletId)

    const unusedReceivingAddresses = allUnusedAddresses
      .filter(addr => addr.addressType === AddressType.Receiving)
    const unusedChangeAddresses = allUnusedAddresses
      .filter(addr => addr.addressType === AddressType.Change)

    return [unusedReceivingAddresses, unusedChangeAddresses]
  }

  public static async getAllUnusedAddressesByWalletId (walletId: string) {
    const txCountsByLockHashes = await TransactionsService.getTxCountsByWalletId(walletId)

    const addresses = await this.allAddressesByWalletId(walletId)
    for (const address of addresses) {
      const script = Script.fromObject({
        codeHash: SystemScriptInfo.SECP_CODE_HASH,
        hashType: SystemScriptInfo.SECP_HASH_TYPE,
        args: address.blake160
      });
      const lockHash = script.computeHash()
      const txCount = txCountsByLockHashes.get(lockHash)

      if (!txCount) {
        continue
      }
      address.txCount = txCount
    }

    const allUnusedAddresses = addresses.filter(address => !address.txCount)

    return allUnusedAddresses
  }

  public static async nextUnusedAddress (walletId: string): Promise<AddressInterface | undefined> {
    const [unusedReceivingAddresses, unusedChangeAddresses] = await this.getUnusedAddresses(walletId)
    if (unusedReceivingAddresses.length) {
      return unusedReceivingAddresses[0]
    }
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }

    return undefined
  }

  public static async nextUnusedChangeAddress (walletId: string): Promise<AddressInterface | undefined> {
    const [ , unusedChangeAddresses ] = await this.getUnusedAddresses(walletId)
    if (unusedChangeAddresses.length) {
      return unusedChangeAddresses[0]
    }
    return undefined
  }

  public static async allUnusedReceivingAddresses(walletId: string): Promise<AddressInterface[]> {
    const [ unusedReceivingAddresses ] = await this.getUnusedAddresses(walletId)
    return unusedReceivingAddresses
  }


  public static allAddresses = async (): Promise<AddressInterface[]> => {
    const publicKeyInfos = await AddressDao.allAddresses()
    return publicKeyInfos.map(publicKeyInfo => ({
      walletId: publicKeyInfo.walletId,
      address: publicKeyInfo.address,
      path: publicKeyInfo.path,
      addressIndex: publicKeyInfo.addressIndex,
      addressType: publicKeyInfo.addressType,
      blake160: publicKeyInfo.publicKeyInBlake160,
      description: publicKeyInfo.description,
    }))
  }

  public static async allAddressesByWalletId (walletId: string): Promise<AddressInterface[]> {
    const publicKeyInfos = await AddressDao.allAddressesByWalletId(walletId)
    return publicKeyInfos.map(publicKeyInfo => ({
        walletId: publicKeyInfo.walletId,
        address: publicKeyInfo.address,
        path: publicKeyInfo.path,
        addressIndex: publicKeyInfo.addressIndex,
        addressType: publicKeyInfo.addressType,
        blake160: publicKeyInfo.publicKeyInBlake160,
        description: publicKeyInfo.description,
      })
    )
  }

  public static async allAddressesWithBalancesByWalletId (walletId: string): Promise<AddressInterface[]> {
    const publicKeyInfos = await AddressDao.allAddressesByWalletId(walletId)
    const {liveBalances, sentBalances, pendingBalances} = await CellsService.getBalancesByWalletId(walletId)
    const txCounts = await TransactionsService.getTxCountsByWalletId(walletId)
    const allAddressesWithBalances = publicKeyInfos.map(publicKeyInfo => {
      const script = Script.fromObject({
        codeHash: SystemScriptInfo.SECP_CODE_HASH,
        hashType: SystemScriptInfo.SECP_HASH_TYPE,
        args: publicKeyInfo.publicKeyInBlake160
      });
      const lockHash = script.computeHash()
      const liveBalance = liveBalances.get(lockHash) || '0'
      const sentBalance = sentBalances.get(lockHash) || '0'
      const pendingBalance = pendingBalances.get(lockHash) || '0'
      const balance = (BigInt(liveBalance) + BigInt(sentBalance)).toString()

      const txCount = txCounts.get(lockHash) || 0

      return {
        walletId: publicKeyInfo.walletId,
        address: publicKeyInfo.address,
        path: publicKeyInfo.path,
        addressIndex: publicKeyInfo.addressIndex,
        addressType: publicKeyInfo.addressType,
        blake160: publicKeyInfo.publicKeyInBlake160,
        description: publicKeyInfo.description,
        liveBalance,
        sentBalance,
        pendingBalance,
        balance,
        txCount
      }
    })
    return allAddressesWithBalances
  }

  public static async allBlake160sByWalletId(walletId: string): Promise<string[]> {
    return (await AddressService.allAddressesByWalletId(walletId)).map(addr => addr.blake160)
  }

  public static async allLockHashesByWalletId(walletId: string): Promise<string[]> {
    const addresses = (await AddressService.allAddressesByWalletId(walletId)).map(addr => addr.address)
    return AddressParser.batchToLockHash(addresses)
  }

  public static async updateDescription (walletId: string, address: string, description: string) {
    AddressDao.updateDescription(walletId, address, description)
  }

  public static async deleteByWalletId (walletId: string): Promise<void> {
    return AddressDao.deleteByWalletId(walletId)
  }

  private static getAddressVersion = (): AddressVersion => {
    return NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
  }

  private static getAddressPrefix() : AddressPrefix {
    return this.getAddressVersion() === AddressVersion.Mainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet
  }
}
