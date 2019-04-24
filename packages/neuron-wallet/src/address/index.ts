import TransactionsService from '../services/transactions'
import ckbCore from '../core'
import AddressType from './type'
import HD from '../keys/hd'
import { KeysData } from '../keys/keystore'
import { HDAddress } from '../keys/key'

const MaxAddressNumber = 30

class Address {
  public static isUsedAddress = (address: string) => {
    return TransactionsService.hasTransactions(address)
  }

  public static addressFromPrivateKey = (privateKey: string) => {
    const account = ckbCore.wallet.accountFromPrivateKey(Buffer.from(ckbCore.utils.hexToBytes(privateKey)))
    return ckbCore.utils.pubkeyToAddress(account.hexPubKey)
  }

  public static addressFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) => {
    const privateKey = HD.privateKeyFromHDIndex(keysData, index, type)
    return Address.addressFromPrivateKey(privateKey)
  }

  public static latestUnusedAddress = (keysData: KeysData) => {
    const latestUnusedIndex = HD.searchAddress(keysData, 20)
    return HD.privateKeyFromHDIndex(keysData, latestUnusedIndex)
  }

  // Generate both receiving and change addresses
  public static generateAddresses = (
    keysData: KeysData,
    receivingAddressNumber: number,
    changeAddressNumber: number,
  ) => {
    if (receivingAddressNumber < 1 || changeAddressNumber < 1) {
      throw new Error('Address number error.')
    } else if (receivingAddressNumber > MaxAddressNumber || changeAddressNumber > MaxAddressNumber) {
      throw new Error('Address number error.')
    }
    const receivingAddresses: HDAddress[] = []
    const changeAddresses: HDAddress[] = []
    for (let index = 0; index < receivingAddressNumber; index++) {
      receivingAddresses.push({
        address: Address.addressFromHDIndex(keysData, index, AddressType.Receiving),
        path: HD.path(AddressType.Receiving, index),
      })
    }
    for (let index = 0; index < changeAddressNumber; index++) {
      changeAddresses.push({
        address: Address.addressFromHDIndex(keysData, index, AddressType.Change),
        path: HD.path(AddressType.Change, index),
      })
    }
    return {
      receiving: receivingAddresses,
      change: changeAddresses,
    }
  }
}

export default Address
