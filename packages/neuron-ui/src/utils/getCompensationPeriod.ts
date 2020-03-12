import { WITHDRAW_EPOCHS, HOURS_PER_EPOCH, HOURS_PER_DAY } from 'utils/const'

export interface CompensationPeriodParams {
  currentEpochValue: number
  endEpochValue: number
}

const getCompensationPeriod = ({ currentEpochValue, endEpochValue }: CompensationPeriodParams) => {
  const pastEpochs = currentEpochValue - endEpochValue + WITHDRAW_EPOCHS
  const totalHours = Math.ceil((WITHDRAW_EPOCHS - pastEpochs) * HOURS_PER_EPOCH)
  const leftDays = Math.floor(totalHours / HOURS_PER_DAY)
  const leftHours = totalHours % HOURS_PER_DAY

  return {
    pastEpochs: +pastEpochs.toFixed(1),
    leftTime: {
      totalHours,
      days: leftDays,
      hours: leftHours,
    },
  }
}
export default getCompensationPeriod
