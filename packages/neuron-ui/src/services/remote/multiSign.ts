import { remoteApi } from './remoteApiWrapper'

interface MultiSignParams {
  r: number
  m: number
  n: number
  blake160s: string[]
  isMainnet: boolean
}

export interface MultiSignConfig {
  id: number
  walletId: string
  r: number
  m: number
  n: number
  blake160s: string[]
  alias?: string
  fullPayload: string
}

export type ImportMultiSignConfig = Omit<MultiSignConfig, 'id' | 'walletId'>

export const createMultiSignAddress = remoteApi<MultiSignParams>('create-multi-sign-address')
export const saveMultiSignConfig = remoteApi<Omit<MultiSignConfig, 'id'>, MultiSignConfig>('save-multi-sign-config')
export const getMultiSignConfig = remoteApi<{ walletId: string }>('get-multi-sign-config')
export const importMultiSignConfig = remoteApi<{ isMainnet: boolean }, ImportMultiSignConfig>(
  'import-multi-sign-config'
)
export const exportMultiSignConfig = remoteApi<MultiSignConfig[]>('export-multi-sign-config')
export const updateMultiSignConfig = remoteApi<{ id: number } & Omit<Partial<MultiSignConfig>, 'id'>, MultiSignConfig>(
  'update-multi-sign-config'
)
export const deleteMultiSignConfig = remoteApi<{ id: number }>('delete-multi-sign-config')
