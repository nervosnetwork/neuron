/* eslint-disable camelcase */
import { remoteApi } from './remoteApiWrapper'

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
}

interface MultisigConfigs {
  [hash: string]: {
    sighash_addresses: string[]
    require_first_n: number
    threshold: number
  }
}

interface Signatures {
  [hash: string]: string[]
}

export interface OfflineSignJSON {
  transaction: any
  status: OfflineSignStatus
  type: OfflineSignType
  description?: string
  asset_account?: Pick<Controller.SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export type SignProps = OfflineSignJSON & { walletID: string; password: string }

export type BroadcastProps = OfflineSignJSON & { walletID: string }

export const exportTransactionAsJSON = remoteApi<OfflineSignJSON, void>('export-transaction-as-json')
export const signTransactionOnly = remoteApi<OfflineSignJSON, void>('sign-transaction-only')
export const broadcastTransaction = remoteApi<BroadcastProps, void>('broadcast-transaction-only')
export const signAndExportTransaction = remoteApi<SignProps, OfflineSignJSON>('sign-and-export-transaction')
