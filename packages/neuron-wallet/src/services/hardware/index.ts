export interface Hardware {
  deviceInfo: DeviceInfo
  getExtendedPublicKey: () => Promise<ExtendedPublicKey>
  connect: (hardwareInfo?: DeviceInfo) => Promise<void>
  disconect: () => Promise<void>
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
  // The following information may or may not be available to us
  appVersion?: string
  firewareVersion?: string
}

export interface ExtendedPublicKey {
  publicKey: string
  chainCode: string
}
