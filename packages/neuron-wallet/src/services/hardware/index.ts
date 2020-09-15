import type Transaction from 'models/chain/transaction'
import Address, { AddressType } from 'models/keys/address'

export abstract class Hardware {
  public deviceInfo: DeviceInfo
  protected firstReceiveAddress = Address.pathForReceiving(0)

  constructor(device: DeviceInfo) {
    this.deviceInfo = device
  }

  public abstract getExtendedPublicKey(): Promise<ExtendedPublicKey>
  public abstract connect(hardwareInfo?: DeviceInfo): Promise<void>
  public abstract signMessage(path: string, message: string): Promise<string>
  public abstract disconnect(): Promise<void>
  public abstract signTransaction(walletID: string, tx: Transaction): Promise<Transaction>
  public abstract getAppVersion(): Promise<string>
  public abstract getFirmwareVersion?(): Promise<string>
}

export type HardwareClass = new (device: DeviceInfo) => Hardware

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
