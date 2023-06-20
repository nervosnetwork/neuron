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
  minDate?: Date
  maxDate?: Date
}

export type WeekDayRange = 0 | 1 | 2 | 3 | 4 | 5 | 6

export function isDayInRange(date: Date, range: DateRange): boolean {
  const dayBegin = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

  if (range.minDate !== undefined && dayEnd <= range.minDate) {
    return false
  }
  if (range.maxDate !== undefined && dayBegin > range.maxDate) {
    return false
  }
  return true
}

export function isMonthInRange(year: number, month: number, range: DateRange): boolean {
  const monthBegin = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  if (range.minDate !== undefined && monthEnd <= range.minDate) {
    return false
  }
  if (range.maxDate !== undefined && monthBegin > range.maxDate) {
    return false
  }
  return true
}

export function isYearInRange(year: number, range: DateRange): boolean {
  if (range.minDate !== undefined && year < range.minDate.getFullYear()) {
    return false
  }
  if (range.maxDate !== undefined && year > range.maxDate.getFullYear()) {
    return false
  }
  return true
}

export function isDateEqual(a: Date | undefined, b: Date | undefined): boolean {
  if (a === undefined || b === undefined) {
    return false
  }
  return a?.toDateString() === b?.toDateString()
}

/**
 * @description Generate monthly calendar 2D table data
 */
export function getMonthCalendar(year: number, month: number, firstDayOfWeek: WeekDayRange = 0, lang = 'en'): Day[][] {
  const today = new Date()
  const weekdayOfFirstDay = new Date(year, month - 1, 1).getDay()
  const DAYS_IN_WEEK = 7
  const ROWS_IN_CALENDAR = 6
  const numOfDaysInCalendar = DAYS_IN_WEEK * ROWS_IN_CALENDAR

  const dateList: Day[] = []
  const formater = new Intl.DateTimeFormat(lang, { dateStyle: 'full' })

  for (let i = 1; i <= numOfDaysInCalendar; i++) {
    const instance = new Date(year, month - 1, ((firstDayOfWeek - weekdayOfFirstDay - 7) % 7) + i)
    const day: Day = {
      instance,
      year: instance.getFullYear(),
      month: instance.getMonth() + 1,
      date: instance.getDate(),
      weekday: instance.getDay(),
      isCurMonth: instance.getMonth() + 1 === month,
      isToday: instance.toDateString() === today.toDateString(),
      label: formater.format(instance),
    }
    dateList.push(day)
  }

  const calendarData: Day[][] = []

  for (let i = 0; i < dateList.length; i += 7) {
    calendarData.push(dateList.slice(i, i + 7))
  }

  return calendarData
}

export const getLocalMonthShortNames = (lang: string) => {
  const formater = new Intl.DateTimeFormat(lang, { month: 'short' })
  return Array.from(
    { length: 12 },
    (_, i) => `${formater.format(new Date(Date.UTC(2023, i, 1)))}${lang.startsWith('en') ? '.' : ''}`
  )
}

export const getLocalMonthNames = (lang: string) => {
  const formater = new Intl.DateTimeFormat(lang, { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => formater.format(new Date(Date.UTC(2023, i, 1))))
}

export const getLocalWeekNames = (lang: string) => {
  const formater = new Intl.DateTimeFormat(lang, { weekday: 'narrow' })
  return Array.from({ length: 7 }, (_, i) => formater.format(new Date(Date.UTC(2023, 0, 1 + i))))
}
