/* eslint-disable camelcase */
import { Transaction } from '@ckb-connect/walletconnect-wallet-sdk'
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

export interface MultisigConfigs {
  [hash: string]: {
    sighash_addresses: string[]
    require_first_n: number
    threshold: number
  }
}

export interface OfflineSignJSON {
  transaction: State.GeneratedTx
  status: OfflineSignStatus
  type: OfflineSignType
  description?: string
  asset_account?: Pick<Controller.SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
  multisig_configs?: MultisigConfigs
}

export interface WalletConnectSignJSON {
  transaction: Transaction
  status: OfflineSignStatus
  type: OfflineSignType
  description?: string
  asset_account?: Pick<Controller.SUDTAccount, 'symbol' | 'tokenName' | 'accountName' | 'decimal' | 'tokenID'>
  multisig_configs?: MultisigConfigs
}

export type SignProps = (OfflineSignJSON | WalletConnectSignJSON) & {
  walletID: string
  password: string
  multisigConfig?: MultisigEntity
}

export type BroadcastProps = OfflineSignJSON & { walletID: string }

export const exportTransactionAsJSON = remoteApi<OfflineSignJSON | WalletConnectSignJSON, void>(
  'export-transaction-as-json'
)
export const signTransactionOnly = remoteApi<SignProps, void>('sign-transaction-only')
export const broadcastTransaction = remoteApi<BroadcastProps, void>('broadcast-transaction-only')
export const signAndExportTransaction = remoteApi<
  SignProps,
  { filePath: string; json: OfflineSignJSON | WalletConnectSignJSON }
>('sign-and-export-transaction')
export const signAndBroadcastTransaction = remoteApi<SignProps>('sign-and-broadcast-transaction')
