import { epochParser } from 'utils/parsers'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'

export enum CellStatus {
  Depositing,
  Deposited,
  Withdrawing,
  Locked,
  Unlockable,
  Unlocking,
  Completed,
}

interface Info {
  txHash: string
  timestamp: string
}

export interface DAOCellStatusParams {
  unlockInfo?: Info
  withdrawInfo?: Info
  status: 'live' | 'dead' | 'pending' | 'sent' | 'failed'
  currentEpoch: string
  withdrawEpoch: string
  depositEpoch: string
}

export const getDAOCellStatus = ({
  unlockInfo,
  withdrawInfo,
  status,
  currentEpoch,
  withdrawEpoch,
  depositEpoch,
}: DAOCellStatusParams) => {
  if (unlockInfo) {
    // unlocking or unlocked
    if (status === 'pending') {
      return CellStatus.Unlocking
    }
    return CellStatus.Completed
  }

  if (withdrawInfo) {
    // withdrawing or locked or unlockable or immature-for-unlock
    if (status === 'sent') {
      return CellStatus.Withdrawing
    }

    if (withdrawEpoch && depositEpoch && currentEpoch) {
      const currentEpochInfo = epochParser(currentEpoch)
      const withdrawEpochInfo = epochParser(withdrawEpoch)
      const depositEpochInfo = epochParser(depositEpoch)

      const unlockEpochValue = calculateClaimEpochValue(depositEpochInfo, withdrawEpochInfo)

      if (unlockEpochValue < currentEpochInfo.value) {
        return CellStatus.Unlockable
      }
    }

    return CellStatus.Locked
  }

  // deposit
  if (status === 'sent') {
    return CellStatus.Depositing
  }
  return CellStatus.Deposited
}

export default getDAOCellStatus
