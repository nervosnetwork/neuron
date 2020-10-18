const MINS_PER_HOUR = 60
const MILLISECS_PER_HOUR = 3600_000

export const getSyncLeftTime = (estimate: number | undefined) => {
  let leftTime = '-'
  if (typeof estimate === 'number') {
    const time = estimate / MILLISECS_PER_HOUR
    const hrs = Math.floor(time)
    const mins = Math.round((time - hrs) * MINS_PER_HOUR)
    leftTime = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
  return leftTime
}

export default getSyncLeftTime
