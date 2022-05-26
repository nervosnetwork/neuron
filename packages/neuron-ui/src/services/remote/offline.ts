/* eslint-disable camelcase */
import { remoteApi } from './remoteApiWrapper'
import { MultisigEntity } from './multisig'

export enum OfflineSignStatus {
  Signed = 'Signed',
  Unsigned = 'Unsigned',
  PartiallySigned = 'PartiallySigned',
}

export enum OfflineSignType {
  Regular = 'Regular',
  UnlockDAO = 'UnlockDAO',
  CreateSUDTAccount = 'CreateSUDTAccount',
  SendSUDT = 'SendSUDT',
  SendFromMultisigOnlySig = 'SendFromMultisigOnlySig',
  Invalid = 'Invalid',
}

interface MultisigConfigs {
  [hash: string]: {
    sighash_addresses: string[]
    require_first_n: number
    threshold: number
  }
}

export interface Signatures {
  [hash: string]: string[]
}

export interface OfflineSignJSON {
  transaction: {
    signatures?: Signatures
    [key: string]: any
  }
  status: OfflineSignStatus
  type: OfflineSignType
  description?: string
  asset_account?: Pick<Controller.SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
  multisig_configs?: MultisigConfigs
}

export type SignProps = OfflineSignJSON & { walletID: string; password: string; multisigConfig?: MultisigEntity }

export type BroadcastProps = OfflineSignJSON & { walletID: string }

export const exportTransactionAsJSON = remoteApi<OfflineSignJSON, void>('export-transaction-as-json')
export const signTransactionOnly = remoteApi<OfflineSignJSON, void>('sign-transaction-only')
export const broadcastTransaction = remoteApi<BroadcastProps, void>('broadcast-transaction-only')
export const signAndExportTransaction = remoteApi<SignProps, { filePath: string; json: OfflineSignJSON }>(
  'sign-and-export-transaction'
)
export const signAndBroadcastTransaction = remoteApi<SignProps>('sign-and-broadcast-transaction')
