import { AccountExtendedPublicKey } from './key'
import { config, helpers, utils } from '@ckb-lumos/lumos'

export enum AddressType {
  Receiving = 0, // External chain
  Change = 1, // Internal chain
}

export const publicKeyToAddress = (publicKey: string, isMainnet = false) => {
  const pubkey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`
  const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }
  const args = utils.ckbHash(pubkey).slice(0, 42)

  return helpers.encodeToAddress(
    {
      codeHash: lumosOptions.config.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
      hashType: lumosOptions.config.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
      args,
    },
    lumosOptions
  )
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
