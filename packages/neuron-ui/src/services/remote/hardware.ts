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
export const getCkbAppVersion = remoteApi<Descriptor, Version>('get-ckb-app-version')
export const getFirmwareVersion = remoteApi<Descriptor, Version>('get-firmware-version')
export const getPublickey = remoteApi<Descriptor, ExtendedPublicKey>('get-public-key')
export const connectDevice = remoteApi<DeviceInfo, void>('connect-device')
