import { HOURS_PER_EPOCH, HOURS_PER_DAY } from 'utils/const'

export interface CompensatedTimeParams {
  currentEpochValue: number
  depositEpochValue: number
}

export const getCompensatedTime = ({ currentEpochValue, depositEpochValue }: CompensatedTimeParams) => {
  const totalHours = Math.floor((currentEpochValue - depositEpochValue) * HOURS_PER_EPOCH)
  const days = Math.floor(totalHours / HOURS_PER_DAY)
  const hours = totalHours % HOURS_PER_DAY
  return {
    totalHours,
    days,
    hours,
  }
}

export default getCompensatedTime
