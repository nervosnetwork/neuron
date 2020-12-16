/* eslint-disable import/prefer-default-export */
import { FailureFromController } from 'services/remote/remoteApiWrapper'

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
  error?: FailureFromController['message']
}

export interface Model {
  manufacturer: string
  product: string
}
