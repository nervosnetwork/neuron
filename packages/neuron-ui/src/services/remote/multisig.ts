import { remoteApi } from './remoteApiWrapper'
import { OfflineSignJSON } from './offline'

type PartialSome<T, R extends keyof T> = Omit<T, R> & {
  [P in R]?: T[P]
}

type RequiredSome<T, R extends keyof T> = Omit<T, R> & {
  [P in R]-?: T[P]
}

type MultisigParams = {
  id: number
  r: number
  m: number
  n: number
  blake160s: string[]
}

export type MultisigEntity = MultisigParams & {
  id?: number
  walletId: string
  alias?: string
  startBlockNumber?: number
  lockCodeHash: string
}

export type MultisigConfig = MultisigEntity & {
  addresses: string[]
  fullPayload: string
  isLegacy?: boolean
}

export const saveMultisigConfig = remoteApi<PartialSome<MultisigEntity, 'id'>, MultisigEntity>('save-multisig-config')
export const getMultisigConfig = remoteApi<void, MultisigEntity[]>('get-multisig-config')
export const importMultisigConfig = remoteApi<string, MultisigConfig[]>('import-multisig-config')
export const exportMultisigConfig = remoteApi<MultisigConfig[]>('export-multisig-config')
export const updateMultisigConfig = remoteApi<RequiredSome<Partial<MultisigEntity>, 'id'>, MultisigEntity>(
  'update-multisig-config'
)
export const deleteMultisigConfig = remoteApi<number, boolean>('delete-multisig-config')
export const getMultisigBalances = remoteApi<
  { isMainnet: boolean; multisigAddresses: string[] },
  Record<string, string>
>('get-multisig-balances')
export const getMultisigDAOBalances = remoteApi<
  { isMainnet: boolean; multisigAddresses: string[] },
  Record<string, string>
>('get-multisig-dao-balances')
export const generateMultisigTx = remoteApi<{
  items: { address: string; capacity: string }[]
  multisigConfig: MultisigConfig
}>('generate-multisig-tx')
export const generateMultisigSendAllTx = remoteApi<{
  items: { address: string; capacity: string }[]
  multisigConfig: MultisigConfig
}>('generate-multisig-send-all-tx')
export const loadMultisigTxJson = remoteApi<string, OfflineSignJSON>('load-multisig-tx-json')
export const getMultisigSyncProgress = remoteApi<string[], { hash: string; localSavedBlockNumber: number }[]>(
  'get-sync-progress-by-addresses'
)
export const changeMultisigSyncStatus = remoteApi<boolean, void>('change-multisig-sync-status')

export const getMultisigDaoData = remoteApi<{ multisigConfig: MultisigConfig }>('get-multisig-dao-data')

export const generateMultisigDaoDepositTx = remoteApi<
  {
    capacity: string
    feeRate: string
    multisigConfig: MultisigConfig
  },
  State.GeneratedTx
>('generate-multisig-dao-deposit-tx')
export const generateMultisigDaoDepositAllTx = remoteApi<
  {
    isBalanceReserved: boolean
    feeRate: string
    multisigConfig: MultisigConfig
  },
  State.GeneratedTx
>('generate-multisig-dao-deposit-all-tx')
export const generateMultisigDaoWithdrawTx = remoteApi<{
  outPoint: {
    txHash: string
    index: string
  }
  feeRate: string
  multisigConfig: MultisigConfig
}>('start-withdraw-from-multisig-dao')
export const generateMultisigDaoClaimTx = remoteApi<{
  depositOutPoint: {
    txHash: string
    index: string
  }
  withdrawingOutPoint: {
    txHash: string
    index: string
  }
  feeRate: string
  multisigConfig: MultisigConfig
}>('withdraw-from-multisig-dao')
