import React, { useState } from 'react'
import { getMonthCalendar, useLocalNames, monthInRange, yearInRange, dateEqual } from './utils'
import styles from './calendar.module.scss'

interface Option {
  value: number
  title: string
  selectable: boolean
}
const Selector = ({ options, onChange }: { options: Option[]; onChange: (option: Option) => void }) => (
  <ol className={styles.calOptions}>
    {options.map(option => (
      <li key={option.value} role="presentation">
        <button
          type="button"
          aria-label={option.title}
          title={option.title}
          role="menuitem"
          onClick={() => onChange(option)}
          disabled={!option.selectable}
        >
          {option.title}
        </button>
      </li>
    ))}
  </ol>
)

export interface CalendarProps {
  value: Date | undefined
  onChange: (value: Date) => void
  minDate?: Date
  maxDate?: Date
}
const Calendar: React.FC<CalendarProps> = ({ value, onChange, minDate = null, maxDate = null }) => {
  const today = new Date()

  const [year, setYear] = useState(value === undefined ? today.getFullYear() : value.getFullYear())
  const [month, setMonth] = useState(value === undefined ? today.getMonth() + 1 : value.getMonth() + 1)
  const [status, setStatus] = useState<'year' | 'month' | 'date'>('date')

  React.useEffect(() => {
    setYear(value === undefined ? today.getFullYear() : value.getFullYear())
    setMonth(value === undefined ? today.getMonth() + 1 : value.getMonth() + 1)
  }, [value])

  const locale = useLocalNames()
  const weeknames = [...Array(7).keys()].map(_ => locale.dayNamesMin[(_ + locale.firstDayOfWeek) % 7])
  const monthname = locale.monthNames[month - 1]

  const calendar = getMonthCalendar(year, month, { minDate, maxDate })
  const calendarTable = (
    <table className={styles.calendarTable}>
      <thead>
        <tr>
          {weeknames.map(weekname => (
            <th className={styles.calTableHeader} scope="col" key={weekname}>
              {weekname}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {calendar.map(week => (
          <tr key={week[0].label}>
            {week.map(date => (
              <td key={`${date.month}${date.date}`}>
                <button
                  type="button"
                  data-type="button"
                  aria-label={date.label}
                  aria-pressed={dateEqual(date.instance, value)}
                  title={date.label}
                  className={`
                    ${styles.calDateItem}
                    ${date.isToday ? 'today' : ''}
                    ${dateEqual(date.instance, value) ? 'active' : ''}
                  `}
                  disabled={!date.curMonth || !date.selectable}
                  onClick={() => onChange(date.instance)}
                >
                  {date.date}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  const monthOptions: Option[] = [...Array(12).keys()].map(index => ({
    value: index + 1,
    title: locale.monthNames[index],
    selectable: monthInRange(year, index, { minDate, maxDate }),
  }))
  const yearOptions: Option[] = [...Array(12).keys()].map(index => ({
    value: year - 6 + index,
    title: `${year - 6 + index}`,
    selectable: yearInRange(year - 6 + index, { minDate, maxDate }),
  }))

  const prevMonth = () => {
    if (month > 1) {
      setMonth(m => m - 1)
    } else {
      setYear(y => y - 1)
      setMonth(12)
    }
  }
  const nextMonth = () => {
    if (month < 12) {
      setMonth(m => m + 1)
    } else {
      setYear(y => y + 1)
      setMonth(1)
    }
  }

  const calendarHeader = (
    <div className={styles.calendarHeader}>
      <button type="button" aria-label="prev" title="prev" className={styles.calPrev} onClick={prevMonth}>
        {'<'}
      </button>
      <div className={styles.calTitle}>
        <button
          type="button"
          aria-label={monthname}
          title={monthname}
          aria-haspopup="true"
          aria-controls="menu"
          onClick={() => setStatus('month')}
        >
          {monthname}
        </button>
        <button
          type="button"
          aria-label={`${year}`}
          title={`${year}`}
          aria-haspopup="true"
          aria-controls="menu"
          onClick={() => setStatus('year')}
        >
          {year}
        </button>
      </div>
      <button type="button" aria-label="next" title="next" className={styles.calNext} onClick={nextMonth}>
        {'>'}
      </button>
    </div>
  )

  const onChangeMonth = (monthOptionItem: Option) => {
    setMonth(monthOptionItem.value)
    setStatus('date')
  }
  const onChangeYear = (yearOptionItem: Option) => {
    setYear(yearOptionItem.value)
    setStatus('month')
  }

  return (
    <div className={styles.calendar}>
      {calendarHeader}
      {status === 'date' && calendarTable}
      {status === 'year' && <Selector options={yearOptions} onChange={onChangeYear} />}
      {status === 'month' && <Selector options={monthOptions} onChange={onChangeMonth} />}
    </div>
  )
}

export default React.memo(Calendar, (prevProps, nextProps) => {
  if (prevProps.value?.toDateString() !== nextProps.value?.toDateString()) {
    return false
  }
  if (prevProps.minDate?.toDateString() !== nextProps.minDate?.toDateString()) {
    return false
  }
  if (prevProps.maxDate?.toDateString() !== nextProps.maxDate?.toDateString()) {
    return false
  }
  if (prevProps.onChange !== nextProps.onChange) {
    return false
  }
  return true
})
