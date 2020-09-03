import type Transaction from 'models/chain/transaction'
import { AddressType } from 'models/keys/address';
import { ResponseCode } from 'utils/const'

export interface Hardware {
  deviceInfo: DeviceInfo
  getExtendedPublicKey: () => Promise<ExtendedPublicKey>
  connect: (hardwareInfo?: DeviceInfo) => Promise<void>
  disconect: () => Promise<void>
  signTransaction: (walletID: string, tx: Transaction) => Promise<Transaction>
  getAppVersion?: () => Promise<HardwareResponse<string>>
  getFirmwareVersion?: () => Promise<HardwareResponse<string>>
}

export enum Manufacturer {
  Ledger = 'Ledger'
}

export interface HardwareResponse<T> {
  status: ResponseCode,
  result?: T,
  message?: Error
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
