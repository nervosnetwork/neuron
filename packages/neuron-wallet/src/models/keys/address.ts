import { AddressPrefix, blake160, scriptToAddress, systemScripts, bytesToHex } from '@nervosnetwork/ckb-sdk-utils'

import { AccountExtendedPublicKey } from './key'

export { AddressPrefix }

export enum AddressType {
  Receiving = 0, // External chain
  Change = 1, // Internal chain
}

export const publicKeyToAddress = (publicKey: string, isMainnet = false) => {
  const pubkey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`
  return scriptToAddress({ ...systemScripts.SECP256K1_BLAKE160, args: bytesToHex(blake160(pubkey)) }, isMainnet)
}

export default class Address {
  publicKey?: string
  address: string
  path: string // BIP44 path

  constructor(address: string, path: string = Address.pathForReceiving(0)) {
    this.address = address
    this.path = path
  }

  public static fromPublicKey = (publicKey: string, path: string, isMainnet = false) => {
    const address = publicKeyToAddress(publicKey, isMainnet)
    const instance = new Address(address, path)
    instance.publicKey = publicKey
    return instance
  }

  public static pathFor = (type: AddressType, index: number) => {
    return `${AccountExtendedPublicKey.ckbAccountPath}/${type}/${index}`
  }

  public static pathForReceiving = (index: number) => {
    return Address.pathFor(AddressType.Receiving, index)
  }

  public static pathForChange = (index: number) => {
    return Address.pathFor(AddressType.Change, index)
  }
}
