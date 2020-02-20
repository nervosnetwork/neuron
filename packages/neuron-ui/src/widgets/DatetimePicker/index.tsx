import React, { useState, useCallback } from 'react'
import { Calendar } from '@bit/primefaces.primereact.calendar'
import Button from 'widgets/Button'
import { useTranslation } from 'react-i18next'
import styles from './datetimePicker.module.scss'

let UTC: string | number = -new Date().getTimezoneOffset() / 60
if (UTC > 0) {
  UTC = `UTC+${UTC}`
} else {
  UTC = `UTC${UTC}`
}

export interface DatetimePickerProps {
  title?: string
  preset?: Date | string | number | null
  notice?: string
  onConfirm: Function
  onCancel: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
}
const DatetimePicker = ({ preset = new Date(), onConfirm, onCancel, title, notice }: DatetimePickerProps) => {
  const [t] = useTranslation()
  const [status, setStatus] = useState<'done' | 'edit'>('done')
  const [datetime, setDatetime] = useState<any>(preset ? new Date(+preset) : null)
  const [display, setDisplay] = useState<any>(new Date(datetime).toLocaleDateString())

  const locale: any = {
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

  const onEdit = () => {
    setStatus('edit')
  }

  const onSelected = useCallback(
    e => {
      if (e.target.tagName === 'SPAN' && e.target.className !== 'p-disabled') {
        setDisplay(new Date(datetime).toLocaleDateString())
        setStatus('done')
      }
    },
    [setDisplay, datetime]
  )

  const onInput = useCallback(
    (e: any) => {
      setDisplay(e.target.value)
    },
    [setDisplay]
  )

  const onCalendarChange = useCallback(
    e => {
      setDatetime(e.value)
    },
    [setDatetime]
  )

  const onSubmit = useCallback(() => {
    onConfirm(new Date(display).getTime())
  }, [onConfirm, display])

  let selected: Date | undefined = new Date(display)
  if (selected.toString() === 'Invalid Date') {
    selected = undefined
  }

  return (
    <div className={styles.container} onClick={onCancel} role="presentation">
      <div
        role="presentation"
        onDoubleClick={onSelected}
        className={styles.popup}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
        data-status={status}
      >
        {title ? <div className={styles.title}>{title}</div> : null}
        <div className={styles.timezone}>
          <span>{`${t('datetime.timezone')}:`}</span>
          <span>{UTC}</span>
        </div>
        {status === 'done' ? (
          <div role="presentation" onClick={onEdit} className={styles.displayedTime}>
            <span>{t('send.release-on')}</span>
            <span>{display}</span>
          </div>
        ) : (
          <input placeholder={t('send.release-on')} value={display} onChange={onInput} />
        )}
        <Calendar value={selected} onChange={onCalendarChange} inline locale={locale} className={styles.calendar} />
        {notice ? (
          <div className={styles.notice}>
            <h5>{t('common.notice')}</h5>
            {notice}
          </div>
        ) : null}
        <div className={styles.actions}>
          <Button type="cancel" label={t('common.cancel')} onClick={onCancel} />
          <Button type="submit" label={t('common.save')} onClick={onSubmit} disabled={!selected} />
        </div>
      </div>
    </div>
  )
}

DatetimePicker.displayName = 'DatetimePicker'
export default DatetimePicker
