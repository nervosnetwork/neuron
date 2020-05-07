import { SyncStatus } from 'utils/enums'
import { BUFFER_BLOCK_NUMBER, MAX_TIP_BLOCK_DELAY } from 'utils/const'

const TEN_MINS = 10 * 60 * 1000
let blockNumber10MinAgo: string = ''
let timestamp10MinAgo: number | undefined
let prevUrl: string | undefined

export const getSyncStatus = ({
  syncedBlockNumber,
  tipBlockNumber,
  tipBlockTimestamp,
  currentTimestamp,
  url,
}: {
  syncedBlockNumber: string
  tipBlockNumber: string
  tipBlockTimestamp: number
  currentTimestamp: number
  url: string | undefined
}) => {
  if ((!timestamp10MinAgo && tipBlockNumber !== '') || (prevUrl && url !== prevUrl && tipBlockNumber !== '')) {
    timestamp10MinAgo = currentTimestamp
    blockNumber10MinAgo = tipBlockNumber
    prevUrl = url
  }

  const now = Math.floor(currentTimestamp / 1000) * 1000
  if (BigInt(syncedBlockNumber) < BigInt(0) || tipBlockNumber === '0' || tipBlockNumber === '') {
    return SyncStatus.SyncNotStart
  }

  if (timestamp10MinAgo && timestamp10MinAgo + TEN_MINS < currentTimestamp) {
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

export default getSyncStatus
