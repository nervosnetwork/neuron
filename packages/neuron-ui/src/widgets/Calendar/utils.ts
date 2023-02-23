import { useTranslation } from 'react-i18next'

export interface Day {
  instance: Date
  year: number
  month: number
  date: number
  weekday: number
  curMonth: boolean
  isToday: boolean
  label: string
  selectable: boolean
}

interface DateRange {
  minDate: Date | null
  maxDate: Date | null
}

export function dayInRange(date: Date, range: DateRange) {
  if (range.minDate !== null) {
    range.minDate.setHours(0, 0, 0, 0)
    if (date < range.minDate) {
      return false
    }
  }
  if (range.maxDate !== null) {
    range.maxDate.setHours(0, 0, 0, 0)
    if (date > range.maxDate) {
      return false
    }
  }
  return true
}

export function monthInRange(year: number, month: number, range: DateRange) {
  return dayInRange(new Date(year, month + 1, 1), range)
}

export function yearInRange(year: number, range: DateRange) {
  return dayInRange(new Date(year + 1, 1, 1), range)
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
export function getMonthCalendar(year: number, month: number, range: DateRange): Day[][] {
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
      curMonth: instance.getMonth() + 1 === month,
      isToday: instance.toDateString() === today.toDateString(),
      label: instance.toLocaleDateString(),
      selectable: dayInRange(instance, range),
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

  const locale = {
    firstDayOfWeek: 0,
    dayNames: ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.full`)),
    dayNamesShort: ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.short`)),
    dayNamesMin: ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.tag`)),
    monthNames: ['jan', 'feb', 'mar', 'apr', 'may', 'june', 'july', 'aug', 'sept', 'oct', 'nov', 'dec'].map(monname =>
      t(`datetime.${monname}.short`)
    ),
    monthNamesShort: [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'june',
      'july',
      'aug',
      'sept',
      'oct',
      'nov',
      'dec',
    ].map(monname => t(`datetime.${monname}.short`)),
  }

  return locale
}
