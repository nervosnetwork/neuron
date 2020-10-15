import { remoteApi } from './remoteApiWrapper'

export interface Model {
  manufacturer: string
  product: string
}

export enum Manufacturer {
  Ledger = 'Ledger',
}

export interface DeviceInfo {
  descriptor: string
  vendorId: string
  manufacturer: Manufacturer
  product: string
}

export interface ExtendedPublicKey {
  publicKey: string
  chainCode: string
}

export type Descriptor = string
export type Version = string

export const getDevices = remoteApi<Model, DeviceInfo[]>('detect-device')
export const getDeviceCkbAppVersion = remoteApi<Descriptor, Version>('get-device-ckb-app-version')
export const getDeviceFirmwareVersion = remoteApi<Descriptor, Version>('get-device-firmware-version')
export const getDevicePublickey = remoteApi<void, ExtendedPublicKey>('get-device-public-key')
export const connectDevice = remoteApi<DeviceInfo, void>('connect-device')
export const createHardwareWallet = remoteApi<ExtendedPublicKey & { walletName: string }, void>(
  'create-hardware-wallet'
)
