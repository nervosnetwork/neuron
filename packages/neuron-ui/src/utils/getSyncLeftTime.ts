const MILLISECS_PER_SEC = 1_000
const MILLISECS_PER_MIN = 60_000
const MILLISECS_PER_HOUR = 3600_000

export const getSyncLeftTime = (estimate: number | undefined) => {
  let leftTime = '-'
  if (typeof estimate === 'number') {
    const time = estimate / MILLISECS_PER_HOUR
    const hrs = Math.floor(time)
    const mins = Math.floor((estimate - hrs * MILLISECS_PER_HOUR) / MILLISECS_PER_MIN)
    const secs = Math.floor((estimate - hrs * MILLISECS_PER_HOUR - mins * MILLISECS_PER_MIN) / MILLISECS_PER_SEC)
    leftTime = [hrs, mins, secs].map(v => v.toString().padStart(2, '0')).join(':')
  }
  return leftTime
}

export default getSyncLeftTime
