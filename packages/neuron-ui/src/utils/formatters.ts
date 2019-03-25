export const dateFormatter = (time: Date) => {
  const date = new Date(time)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return {
    date: `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d}`,
    time: date.toTimeString().substr(0, 8),
  }
}

export default {
  dateFormatter,
}
