import { hd } from '@ckb-lumos/lumos'

type AddressType = hd.AddressType

export enum Manufacturer {
  Ledger = 'Ledger',
}

export interface DeviceInfo {
  descriptor: string
  vendorId: string
  manufacturer: Manufacturer
  product: string
  isBluetooth: boolean
  // for single address
  addressType: AddressType
  addressIndex: number
  // The following information may or may not be available to us
  appVersion?: string
  firmwareVersion?: string
}

export interface ExtendedPublicKey {
  publicKey: string
  chainCode: string
}

export interface PublicKey {
  publicKey: string
  lockArg: string
  address: string
}
