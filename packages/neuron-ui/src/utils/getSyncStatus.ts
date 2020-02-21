import { SyncStatus, BUFFER_BLOCK_NUMBER, MAX_TIP_BLOCK_DELAY } from 'utils/const'

const TEN_MINS = 10 * 60 * 1000
let blockNumber10MinAgo: string = ''
let timestamp10MinAgo: number | undefined

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
  if (!timestamp10MinAgo) {
    timestamp10MinAgo = currentTimestamp
    blockNumber10MinAgo = tipBlockNumber
  }

  const now = Math.floor(currentTimestamp / 1000) * 1000
  if (tipBlockNumber === '') {
    return SyncStatus.FailToFetchTipBlock
  }
  if (BigInt(syncedBlockNumber) < BigInt(0) || tipBlockNumber === '0') {
    return SyncStatus.SyncNotStart
  }

  if (timestamp10MinAgo + TEN_MINS < currentTimestamp) {
    if (BigInt(blockNumber10MinAgo) >= BigInt(tipBlockNumber)) {
      return SyncStatus.SyncPending
    }
    timestamp10MinAgo = currentTimestamp
    blockNumber10MinAgo = tipBlockNumber
  }
  if (BigInt(syncedBlockNumber) + BigInt(BUFFER_BLOCK_NUMBER) < BigInt(tipBlockNumber)) {
    return SyncStatus.Syncing
  }
  if (tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= now) {
    return SyncStatus.SyncCompleted
  }
  return SyncStatus.Syncing
}
