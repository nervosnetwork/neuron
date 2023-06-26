import React, { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as ArrowPrev } from 'widgets/Icons/ArrowPrev.svg'
import { ReactComponent as ArrowNext } from 'widgets/Icons/ArrowNext.svg'
import {
  getMonthCalendar,
  getLocalMonthNames,
  getLocalMonthShortNames,
  getLocalWeekNames,
  isMonthInRange,
  isYearInRange,
  isDateEqual,
  isDayInRange,
  WeekDayRange,
} from './utils'
import { ButtonHasFocus, useTableFocusControl, useSelectorFocusControl, useFocusObserve } from './focusControl'
import styles from './calendar.module.scss'

interface Option {
  value: number
  title: string
  label: string
  selectable: boolean
}
interface SelectorProps {
  value: number
  options: Option[]
  onChange: (option: Option) => void
}
const Selector = ({ value, options, onChange }: SelectorProps) => {
  const { focusIndex, onKeyDown } = useSelectorFocusControl(value, options, onChange)
  return (
    <ol className={styles.calOptions} role="menu" onKeyDown={onKeyDown}>
      {options.map((option, idx) => (
        <li key={option.value} role="presentation">
          <ButtonHasFocus
            isMoveFocus
            isFocusable={focusIndex === idx}
            type="button"
            aria-label={option.label}
            aria-disabled={!option.selectable}
            aria-checked={value === option.value}
            title={option.label}
            role="menuitemradio"
            onClick={() => onChange(option)}
            disabled={!option.selectable}
          >
            {option.title}
          </ButtonHasFocus>
        </li>
      ))}
    </ol>
  )
}

export interface CalendarProps {
  value: Date | undefined
  onChange: (value: Date) => void
  minDate?: Date
  maxDate?: Date
  firstDayOfWeek?: WeekDayRange
  className?: string
}
const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  firstDayOfWeek = 0,
  className = '',
}) => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [status, setStatus] = useState<'year' | 'month' | 'date'>('date')

  const [uId] = useState(() => (+new Date()).toString(16).slice(-4))

  const [t, { language }] = useTranslation()
  const monthNames = useMemo(() => getLocalMonthNames(language), [language])
  const monthShortNames = useMemo(() => getLocalMonthShortNames(language), [language])
  const weekNames = useMemo(() => getLocalWeekNames(language), [language])

  const weekTitle = useMemo(() => Array.from({ length: 7 }, (_, i) => weekNames[(i + firstDayOfWeek) % 7]), [weekNames])
  const monthShortName = monthShortNames[month - 1]

  const calendar = useMemo(
    () => getMonthCalendar(year, month, firstDayOfWeek, language),
    [year, month, firstDayOfWeek, language]
  )
  function isDisabledTime(date: Date): boolean {
    return !isDayInRange(date, { minDate, maxDate })
  }
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
  const { focusDate, onKeyDown } = useTableFocusControl(
    value,
    minDate,
    maxDate,
    year,
    month,
    setYear,
    setMonth,
    onChange
  )
  const { isComponetFocused, ...focusListeners } = useFocusObserve()
  const calendarTable = (
    <table
      className={styles.calendarTable}
      role="grid"
      aria-labelledby={`calendar-title-${uId}`}
      onKeyDown={onKeyDown}
      {...focusListeners}
    >
      <thead aria-hidden="true">
        <tr>
          {weekTitle.map(weekname => (
            <th scope="col" key={weekname}>
              {weekname}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {calendar.map(week => (
          <tr key={week[0].label}>
            {week.map(date => (
              <td key={`${date.month}${date.date}`} role="gridcell">
                <ButtonHasFocus
                  isMoveFocus={isComponetFocused}
                  isFocusable={isDateEqual(date.instance, focusDate)}
                  type="button"
                  data-type="button"
                  aria-label={date.label}
                  aria-pressed={isDateEqual(date.instance, value)}
                  aria-current={date.isToday ? 'date' : 'false'}
                  aria-hidden={!date.isCurMonth}
                  aria-disabled={isDisabledTime(date.instance)}
                  title={date.label}
                  className={styles.calDateItem}
                  disabled={!date.isCurMonth || isDisabledTime(date.instance)}
                  onClick={() => onChange(date.instance)}
                >
                  {date.date}
                </ButtonHasFocus>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  const calendarHeader = (
    <header className={styles.calendarHeader} aria-labelledby={`calendar-title-${uId}`} role="toolbar">
      <h2 className={styles.calTitle} aria-live="polite" id={`calendar-title-${uId}`}>
        {monthShortName} {year}
      </h2>
      <button
        type="button"
        aria-label={t('datetime.previous-month')}
        tabIndex={status === 'date' ? 0 : -1}
        title={t('datetime.previous-month')}
        className={styles.calPrev}
        disabled={!isMonthInRange(year, month - 1, { minDate, maxDate })}
        onClick={prevMonth}
      >
        <ArrowPrev />
      </button>
      <button
        type="button"
        aria-label={t('datetime.next-month')}
        tabIndex={status === 'date' ? 0 : -1}
        title={t('datetime.next-month')}
        className={styles.calNext}
        onClick={nextMonth}
        disabled={!isMonthInRange(year, month + 1, { minDate, maxDate })}
      >
        <ArrowNext />
      </button>
    </header>
  )

  const monthOptions: Option[] = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    title: monthShortNames[index],
    label: monthNames[index],
    selectable: isMonthInRange(year, index + 1, { minDate, maxDate }),
  }))
  const yearOptions: Option[] = Array.from({ length: 12 }, (_, index) => ({
    value: year - 6 + index,
    title: `${year - 6 + index}`,
    label: `${year - 6 + index}`,
    selectable: isYearInRange(year - 6 + index, { minDate, maxDate }),
  }))
  const onChangeMonth = useCallback((monthOptionItem: Option) => {
    setMonth(monthOptionItem.value)
    setStatus('date')
  }, [])
  const onChangeYear = useCallback(
    (yearOptionItem: Option) => {
      setYear(yearOptionItem.value)
      if (!isMonthInRange(yearOptionItem.value, month, { minDate, maxDate })) {
        setMonth((minDate?.getMonth() || 0) + 1)
      }
      setStatus('month')
    },
    [month, minDate?.toDateString(), maxDate?.toDateString()]
  )

  return (
    <div className={`${styles.calendar} ${className}`} aria-labelledby={`calendar-title-${uId}`}>
      {calendarHeader}
      {status === 'date' && calendarTable}
      {status === 'year' && <Selector value={year} options={yearOptions} onChange={onChangeYear} />}
      {status === 'month' && <Selector value={month} options={monthOptions} onChange={onChangeMonth} />}
    </div>
  )
}

export default React.memo(
  Calendar,
  (prevProps, nextProps) =>
    prevProps.value?.toDateString() === nextProps.value?.toDateString() &&
    prevProps.minDate?.toDateString() === nextProps.minDate?.toDateString() &&
    prevProps.maxDate?.toDateString() === nextProps.maxDate?.toDateString() &&
    prevProps.className === nextProps.className &&
    prevProps.firstDayOfWeek === nextProps.firstDayOfWeek &&
    prevProps.onChange === nextProps.onChange
)
