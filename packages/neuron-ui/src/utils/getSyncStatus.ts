import { SyncStatus, BUFFER_BLOCK_NUMBER, MAX_TIP_BLOCK_DELAY } from 'utils/const'

export default ({
  syncedBlockNumber,
  tipBlockNumber,
  tipBlockTimestamp,
  currentTimestamp,
}: {
  syncedBlockNumber: string
  tipBlockNumber: string
  tipBlockTimestamp: number
  currentTimestamp: number
}) => {
  const now = Math.floor(currentTimestamp / 1000) * 1000
  if (tipBlockNumber === '') {
    return SyncStatus.FailToFetchTipBlock
  }
  if (BigInt(syncedBlockNumber) < BigInt(0) || tipBlockNumber === '0') {
    return SyncStatus.SyncNotStart
  }

  if (BigInt(syncedBlockNumber) + BigInt(BUFFER_BLOCK_NUMBER) < BigInt(tipBlockNumber)) {
    return SyncStatus.Syncing
  }
  if (tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= now) {
    return SyncStatus.SyncCompleted
  }
  return SyncStatus.Syncing
}
