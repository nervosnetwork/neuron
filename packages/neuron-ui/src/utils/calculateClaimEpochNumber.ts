import { WITHDRAW_EPOCHS } from 'utils/const'

interface EpochInfo {
  index: bigint
  number: bigint
  length: bigint
}

export default (depositEpochInfo: EpochInfo, currentEpochInfo: EpochInfo) => {
  let depositedEpochs = currentEpochInfo.number - depositEpochInfo.number
  const depositEpochFraction = depositEpochInfo.index * currentEpochInfo.length
  const currentEpochFraction = currentEpochInfo.index * depositEpochInfo.length
  if (currentEpochFraction > depositEpochFraction) {
    depositedEpochs += BigInt(1)
  }
  const minLockEpochs =
    ((depositedEpochs + BigInt(WITHDRAW_EPOCHS - 1)) / BigInt(WITHDRAW_EPOCHS)) * BigInt(WITHDRAW_EPOCHS)
  const targetEpochNumber = depositEpochInfo.number + minLockEpochs
  return targetEpochNumber
}
