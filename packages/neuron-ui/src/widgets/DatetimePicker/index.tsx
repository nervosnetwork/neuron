import React, { useState, useCallback } from 'react'
import { Calendar } from '@bit/primefaces.primereact.calendar'
import Button from 'widgets/Button'
import { useTranslation } from 'react-i18next'
import styles from './datetimePicker.module.scss'

const SECONDS_PER_DAY = 24 * 3600 * 1000
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
const DatetimePicker = ({
  preset = new Date(Date.now() + SECONDS_PER_DAY),
  onConfirm,
  onCancel,
  title,
  notice,
}: DatetimePickerProps) => {
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

  let selected: Date | undefined = new Date(display)
  if (selected.toString() === 'Invalid Date') {
    selected = undefined
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isSinceTomorrow = new Date(display).getTime() >= new Date(tomorrow.toDateString()).getTime()
  const disabled = !selected || !isSinceTomorrow

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
    e => {
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
    if (disabled) {
      return
    }
    onConfirm(new Date(display).getTime())
  }, [onConfirm, display, disabled])

  const onKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        onSubmit()
      }
    },
    [onSubmit]
  )

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
          <input placeholder={t('send.release-on')} value={display} onChange={onInput} onKeyPress={onKeyPress} />
        )}
        <Calendar
          value={selected}
          minDate={new Date()}
          onChange={onCalendarChange}
          inline
          locale={locale}
          className={styles.calendar}
        />
        {isSinceTomorrow ? null : <span className={styles.error}>{t('datetime.start-tomorrow')}</span>}
        {notice ? (
          <div className={styles.notice}>
            <h5>{t('common.notice')}</h5>
            {notice}
          </div>
        ) : null}
        <div className={styles.actions}>
          <Button type="cancel" label={t('common.cancel')} onClick={onCancel} />
          <Button type="submit" label={t('common.save')} onClick={onSubmit} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}

DatetimePicker.displayName = 'DatetimePicker'
export default DatetimePicker
