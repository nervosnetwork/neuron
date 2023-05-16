import React, { useState, useCallback, useRef, useEffect } from 'react'
import Calendar from 'widgets/Calendar'
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

export const formatDate = (datetime: Date) => {
  const month = (datetime.getMonth() + 1).toString().padStart(2, '0')
  const date = datetime
    .getDate()
    .toString()
    .padStart(2, '0')
  const year = datetime.getFullYear()
  return `${month}/${date}/${year}`
}

export interface DatetimePickerProps {
  title?: string
  preset?: Date | string | number | null
  notice?: string
  onConfirm: (time: number) => void
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
  const [display, setDisplay] = useState<string>(preset ? formatDate(new Date(+preset)) : '')
  const inputRef = useRef<HTMLInputElement | null>(null)

  let selected: Date | undefined = display ? new Date(display) : undefined
  if (selected?.toString() === 'Invalid Date') {
    selected = undefined
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isSinceTomorrow = display ? new Date(display).getTime() >= new Date(tomorrow.toDateString()).getTime() : false
  const disabled = !selected || !isSinceTomorrow

  const onEdit = () => {
    setStatus('edit')
  }

  useEffect(() => {
    if (status === 'edit' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [status, inputRef])

  const onInputBlur = useCallback(() => {
    setStatus('done')
  }, [setStatus])

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplay(e.target.value)
    },
    [setDisplay]
  )

  const onCalendarChange = useCallback(
    (date: Date) => {
      setDisplay(formatDate(date))
      setStatus('done')
    },
    [setDisplay, setStatus]
  )

  const onSubmit = useCallback(() => {
    if (disabled || !display) {
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
        className={styles.popup}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
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
          <input
            ref={inputRef}
            placeholder={t('send.release-on')}
            value={display}
            onChange={onInput}
            onBlur={onInputBlur}
            onKeyPress={onKeyPress}
          />
        )}
        <Calendar className={styles.calendar} value={selected} minDate={tomorrow} onChange={onCalendarChange} />
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
