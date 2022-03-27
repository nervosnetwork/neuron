import { remoteApi } from './remoteApiWrapper'

interface MultisigParams {
  r: number
  m: number
  n: number
  addresses: string[]
  isMainnet: boolean
}

export interface MultisigConfig {
  id: number
  walletId: string
  r: number
  m: number
  n: number
  addresses: string[]
  alias?: string
  fullPayload: string
}

export const createMultisigAddress = remoteApi<MultisigParams>('create-multisig-address')
export const saveMultisigConfig = remoteApi<Omit<MultisigConfig, 'id'>, MultisigConfig>('save-multisig-config')
export const getMultisigConfig = remoteApi<{ walletId: string }>('get-multisig-config')
export const importMultisigConfig = remoteApi<{ isMainnet: boolean; walletId: string }, MultisigConfig[]>(
  'import-multisig-config'
)
export const exportMultisigConfig = remoteApi<MultisigConfig[]>('export-multisig-config')
export const updateMultisigConfig = remoteApi<{ id: number } & Omit<Partial<MultisigConfig>, 'id'>, MultisigConfig>(
  'update-multisig-config'
)
export const deleteMultisigConfig = remoteApi<{ id: number }>('delete-multisig-config')
export const getMultisigBalances = remoteApi<
  { isMainnet: boolean; multisigAddresses: string[] },
  Record<string, string>
>('get-multisig-balances')
export const generateMultisigTx = remoteApi<{
  items: { address: string; capacity: string }[]
  multisigConfig: MultisigConfig
}>('generate-multisig-tx')
