import { remoteApi } from './remoteApiWrapper'

export const getLiveCells = remoteApi<void, Omit<State.LiveCellWithLocalInfo, 'lockedReason' | 'cellType'>[]>(
  'get-live-cells'
)
export const updateLiveCellsLocalInfo = remoteApi<State.UpdateLiveCellLocalInfo, void>('update-live-cell-local-info')

export const getLockedBalance = remoteApi<void, string>('get-locked-balance')

export const updateLiveCellsLockStatus = remoteApi<State.UpdateLiveCellsLockStatus, void>(
  'update-live-cells-lock-status'
)
