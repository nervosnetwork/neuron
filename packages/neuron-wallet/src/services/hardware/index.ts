import type Transaction from 'models/chain/transaction'
import { AddressType } from 'models/keys/address';

export interface Hardware {
  deviceInfo: DeviceInfo
  getExtendedPublicKey: () => Promise<ExtendedPublicKey>
  connect: (hardwareInfo?: DeviceInfo) => Promise<void>
  signMessage: (path: string, messageHex: string) => Promise<string>
  disconect: () => Promise<void>
  signTransaction: (walletID: string, tx: Transaction) => Promise<Transaction>
  getAppVersion: () => Promise<string>
  getFirmwareVersion?: () => Promise<string>
}

export enum Manufacturer {
  Ledger = 'Ledger'
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
