import React, { useState, useCallback } from 'react'
import { Calendar } from '@bit/primefaces.primereact.calendar'
import { useTranslation } from 'react-i18next'
import './datetimePicker.module.scss'

export interface DatetimePickerProps {
  preset?: Date | null
  onPick: Function
}
const DatetimePicker = ({ preset = new Date(), onPick }: DatetimePickerProps) => {
  const [t] = useTranslation()
  const [datetime, setDatetime] = useState<any>(preset)

  const locale: any = {
    firstDayOfWeek: 0,
    dayNames: ['sun', 'mon', 'tues', 'wed', 'thus', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.full`)),
    dayNamesShort: ['sun', 'mon', 'tue', 'wed', 'thus', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.short`)),
    dayNamesMin: ['sun', 'mon', 'tue', 'wed', 'thus', 'fri', 'sat'].map(dayname => t(`datetime.${dayname}.tag`)),
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

  const onSelected = useCallback(
    e => {
      if (e.target.tagName === 'SPAN' && e.target.className !== 'p-disabled') {
        onPick(new Date(datetime).getTime())
      }
    },
    [onPick, datetime]
  )
  return (
    <div onDoubleClick={onSelected}>
      <Calendar value={datetime} onChange={e => setDatetime(e.value)} inline locale={locale} />
    </div>
  )
}

DatetimePicker.displayName = 'DatetimePicker'
export default DatetimePicker
