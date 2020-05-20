import { WITHDRAW_EPOCHS } from 'utils/const'

interface EpochInfo {
  index: bigint
  number: bigint
  length: bigint
}

export const calculateClaimEpochValue = (depositEpochInfo: EpochInfo, withdrawingEpochInfo: EpochInfo) => {
  let depositedEpochs = withdrawingEpochInfo.number - depositEpochInfo.number
  const depositEpochFraction = depositEpochInfo.index * withdrawingEpochInfo.length
  const currentEpochFraction = withdrawingEpochInfo.index * depositEpochInfo.length
  if (currentEpochFraction > depositEpochFraction) {
    depositedEpochs += BigInt(1)
  }
  const minLockEpochs =
    depositedEpochs < BigInt(WITHDRAW_EPOCHS)
      ? BigInt(WITHDRAW_EPOCHS)
      : ((depositedEpochs + BigInt(WITHDRAW_EPOCHS - 1)) / BigInt(WITHDRAW_EPOCHS)) * BigInt(WITHDRAW_EPOCHS)
  const targetEpochValue =
    Number(depositEpochInfo.number + minLockEpochs) + Number(depositEpochInfo.index) / Number(depositEpochInfo.length)
  return targetEpochValue
}

export default calculateClaimEpochValue
