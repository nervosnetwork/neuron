/* eslint-disable import/prefer-default-export */

export enum RoutePath {
  DetectDevice = '/detect-device',
  Comfirming = '/confirming',
  Error = '/error',
  Success = '/success',
  NameWallet = '/name-wallet',
  ImportHardware = '/import-hardware',
}

export interface LocationState {
  entryPath: string
  model: Model
  extendedPublicKey?: {
    publicKey: string
    chainCode: string
  }
  error?: string | Error
}

export interface Model {
  manufacturer: string
  product: string
}
