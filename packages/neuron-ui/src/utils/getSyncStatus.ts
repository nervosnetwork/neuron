import { SyncStatus } from 'utils/enums'
import { BUFFER_BLOCK_NUMBER, MAX_TIP_BLOCK_DELAY } from 'utils/const'

const TEN_MINS = 10 * 60 * 1000
let blockNumber10MinAgo: number = -1
let timestamp10MinAgo: number | undefined
let prevUrl: string | undefined
let prevNetworkID: string | undefined

export const getSyncStatus = ({
  bestKnownBlockNumber,
  bestKnownBlockTimestamp,
  cacheTipBlockNumber,
  currentTimestamp,
  url,
  networkID,
}: {
  bestKnownBlockNumber: number
  bestKnownBlockTimestamp: number
  cacheTipBlockNumber: number
  currentTimestamp: number
  url: string | undefined
  networkID: string
}) => {
  if (
    (!timestamp10MinAgo && bestKnownBlockNumber >= 0) ||
    (((prevUrl && url !== prevUrl) || (prevNetworkID && prevNetworkID !== networkID)) && bestKnownBlockNumber >= 0)
  ) {
    timestamp10MinAgo = currentTimestamp
    blockNumber10MinAgo = bestKnownBlockNumber
    prevUrl = url
    prevNetworkID = networkID
  }

  const now = Math.floor(currentTimestamp / 1000) * 1000
  if (cacheTipBlockNumber < 0 || bestKnownBlockNumber <= 0) {
    return SyncStatus.SyncNotStart
  }

  if (timestamp10MinAgo && timestamp10MinAgo + TEN_MINS < currentTimestamp) {
    if (blockNumber10MinAgo >= bestKnownBlockNumber) {
      return SyncStatus.SyncPending
    }
    timestamp10MinAgo = currentTimestamp
    blockNumber10MinAgo = bestKnownBlockNumber
  }
  if (cacheTipBlockNumber + BUFFER_BLOCK_NUMBER < bestKnownBlockNumber) {
    return SyncStatus.Syncing
  }
  if (bestKnownBlockTimestamp + MAX_TIP_BLOCK_DELAY >= now) {
    return SyncStatus.SyncCompleted
  }
  return SyncStatus.Syncing
}

export default getSyncStatus
