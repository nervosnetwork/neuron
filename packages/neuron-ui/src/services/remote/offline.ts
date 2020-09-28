/* eslint-disable camelcase */
import { remoteApi } from './remoteApiWrapper'

export enum SignStatus {
  Signed = 'Signed',
  Unsigned = 'Unsigned',
  PartiallySigned = 'PartiallySigned',
}

export enum SignType {
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
  status: SignStatus
  type: SignType
  asset_account?: Pick<Controller.SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
  multisig_configs?: MultisigConfigs
  signatures?: Signatures
}

export const exportTransactionAsJSON = remoteApi<OfflineSignJSON, void>('export-transaction-as-json')
export const signTransactionOnly = remoteApi<OfflineSignJSON, void>('sign-transaction-only')
export const broadcastTransactionOnly = remoteApi<OfflineSignJSON, void>('broadcast-transaction-only')
export const signAndExportTransaction = remoteApi<OfflineSignJSON, void>('sign-and-export-transaction')
