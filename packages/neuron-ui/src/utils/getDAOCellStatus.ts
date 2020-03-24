import { IMMATURE_EPOCHS } from 'utils/const'
import { epochParser } from 'utils/parsers'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'

export enum CellStatus {
  Depositing,
  FourEpochsSinceDeposit,
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

export default ({
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
    // withdrawing or locked or unlockable
    if (status === 'sent') {
      return CellStatus.Withdrawing
    }

    if (withdrawEpoch && depositEpoch && currentEpoch) {
      const currentEpochInfo = epochParser(currentEpoch)
      const withdrawEpochInfo = epochParser(withdrawEpoch)
      const depositEpochInfo = epochParser(depositEpoch)

      const unlockEpochValue = calculateClaimEpochValue(depositEpochInfo, withdrawEpochInfo) + IMMATURE_EPOCHS

      if (unlockEpochValue <= currentEpochInfo.value) {
        return CellStatus.Unlockable
      }
    }

    return CellStatus.Locked
  }

  // deposit
  if (status === 'sent') {
    return CellStatus.Depositing
  }
  const currentEpochInfo = epochParser(currentEpoch)
  const depositEpochInfo = epochParser(depositEpoch)

  if (currentEpochInfo.value < depositEpochInfo.value + IMMATURE_EPOCHS) {
    // deposited but immature
    return CellStatus.FourEpochsSinceDeposit
  }
  return CellStatus.Deposited
}
