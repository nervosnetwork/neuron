import React, { useState, useCallback, useRef, useEffect } from 'react'
import Calendar from 'widgets/Calendar'
import Dialog from 'widgets/Dialog'
import { Attention } from 'widgets/Icons/icon'
import { useTranslation } from 'react-i18next'
import styles from './datetimePickerDialog.module.scss'

const SECONDS_PER_DAY = 24 * 3600 * 1000
let UTC: string | number = -new Date().getTimezoneOffset() / 60
if (UTC > 0) {
  UTC = `UTC+${UTC}`
} else {
  UTC = `UTC${UTC}`
}

export const formatDate = (datetime: Date) => {
  const month = (datetime.getMonth() + 1).toString().padStart(2, '0')
  const date = datetime.getDate().toString().padStart(2, '0')
  const year = datetime.getFullYear()
  return `${year}-${month}-${date}`
}

export interface DatetimePickerDialogProps {
  show: boolean
  preset?: Date | string | number | null
  notice?: string
  onConfirm: Function
  onCancel: () => void
}
const DatetimePickerDialog = ({
  show,
  preset = new Date(Date.now() + SECONDS_PER_DAY),
  onConfirm,
  onCancel,
  notice,
}: DatetimePickerDialogProps) => {
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
    <Dialog
      show={show}
      title={t('send.set-locktime')}
      subTitle={`${t('datetime.timezone')}: ${UTC}`}
      onConfirm={onSubmit}
      onCancel={onCancel}
      confirmText={t('common.save')}
      cancelText={t('common.cancel')}
      disabled={disabled}
    >
      <div className={styles.container} role="presentation">
        <div
          role="presentation"
          className={styles.popup}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <div className={styles.calendarContainer}>
            <div className={styles.calendarWrap}>
              <Calendar className={styles.calendar} value={selected} minDate={tomorrow} onChange={onCalendarChange} />
            </div>
          </div>

          {isSinceTomorrow ? null : <span className={styles.error}>{t('datetime.start-tomorrow')}</span>}

          <div className={styles.edit}>
            <p>{t('send.release-on')}</p>
            <input
              ref={inputRef}
              placeholder={t('send.release-on')}
              value={display}
              onChange={onInput}
              onBlur={onInputBlur}
              onKeyPress={onKeyPress}
            />
          </div>

          {notice ? (
            <div className={styles.notice}>
              <Attention />
              {notice}
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  )
}

DatetimePickerDialog.displayName = 'DatetimePickerDialog'
export default DatetimePickerDialog
