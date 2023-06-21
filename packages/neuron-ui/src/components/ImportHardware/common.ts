/* eslint-disable import/prefer-default-export */
import { FailureFromController } from 'services/remote/remoteApiWrapper'

export enum ImportStep {
  DetectDevice = '/detect-device',
  Comfirming = '/confirming',
  Error = '/error',
  Success = '/success',
  NameWallet = '/name-wallet',
  ImportHardware = '/import-hardware',
}

export interface Model {
  manufacturer: string
  product: string
}

export interface ImportHardwareState {
  model?: Model | null
  extendedPublicKey?: {
    publicKey: string
    chainCode: string
  }
  error?: FailureFromController['message']
  step: ImportStep
}

export type ActionType = Partial<ImportHardwareState>
