import { useTranslation } from 'react-i18next'

export interface Day {
  instance: Date
  year: number
  month: number
  date: number
  weekday: number
  isCurMonth: boolean
  isToday: boolean
  label: string
}

interface DateRange {
  minDate: Date | null
  maxDate: Date | null
}

export function dayInRange(date: Date, range: DateRange) {
  const dayBegin = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

  if (range.minDate !== null && dayEnd <= range.minDate) {
    return false
  }
  if (range.maxDate !== null && dayBegin > range.maxDate) {
    return false
  }
  return true
}

export function monthInRange(year: number, monthIndex: number, range: DateRange) {
  const monthBegin = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 1)

  if (range.minDate !== null && monthEnd <= range.minDate) {
    return false
  }
  if (range.maxDate !== null && monthBegin > range.maxDate) {
    return false
  }
  return true
}

export function yearInRange(year: number, range: DateRange) {
  if (range.minDate !== null && year < range.minDate.getFullYear()) {
    return false
  }
  if (range.maxDate !== null && year > range.maxDate.getFullYear()) {
    return false
  }
  return true
}

export function dateEqual(a: Date | undefined, b: Date | undefined) {
  if (a === undefined || b === undefined) {
    return false
  }
  return a?.toDateString() === b?.toDateString()
}

/**
 * @description Generate monthly calendar 2D table data
 */
export function getMonthCalendar(year: number, month: number): Day[][] {
  const today = new Date()
  const weekdayOfFirstDay = new Date(year, month - 1, 1).getDay()
  const numOfDaysInCalendar = 42
  const firstDayOfWeek = 0

  const dateList: Day[] = []

  for (let i = 1; i <= numOfDaysInCalendar; i++) {
    const instance = new Date(year, month - 1, firstDayOfWeek - weekdayOfFirstDay + i)
    const day: Day = {
      instance,
      year: instance.getFullYear(),
      month: instance.getMonth() + 1,
      date: instance.getDate(),
      weekday: instance.getDay(),
      isCurMonth: instance.getMonth() + 1 === month,
      isToday: instance.toDateString() === today.toDateString(),
      label: instance.toLocaleDateString(),
    }
    dateList.push(day)
  }

  const calendarData: Day[][] = []

  for (let i = 0; i < dateList.length; i += 7) {
    calendarData.push(dateList.slice(i, i + 7))
  }

  return calendarData
}

export const useLocalNames = () => {
  const [t] = useTranslation()

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat']
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'june', 'july', 'aug', 'sept', 'oct', 'nov', 'dec']

  const locale = {
    firstDayOfWeek: 0,
    dayNames: dayNames.map(dayname => t(`datetime.${dayname}.full`)),
    dayNamesShort: dayNames.map(dayname => t(`datetime.${dayname}.short`)),
    dayNamesMin: dayNames.map(dayname => t(`datetime.${dayname}.tag`)),
    monthNames: monthNames.map(monname => t(`datetime.${monname}.short`)),
    monthNamesShort: monthNames.map(monname => t(`datetime.${monname}.short`)),
  }

  return locale
}
