import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AlertDialog from 'widgets/AlertDialog'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import { ReactComponent as Trash } from 'widgets/Icons/Trash.svg'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import TimeClock from 'widgets/Icons/TimeClock.svg'

import { formatDate } from 'widgets/DatetimePickerDialog'
import { localNumberFormatter, PlaceHolders, isSecp256k1Address } from 'utils'
import { ErrorWithI18n } from 'exceptions'

import styles from './sendFieldset.module.scss'

interface SendSubformProps {
  idx: number
  item: Readonly<{ disabled?: boolean; date?: string | undefined } & Record<'address' | 'amount', string | undefined>>
  errors: Partial<Record<'addrError' | 'amountError', ErrorWithI18n>>
  isSendMax: boolean
  isMaxBtnDisabled: boolean
  isMaxBtnShow: boolean
  isRemoveBtnShow: boolean
  isTimeLockable?: boolean
  onOutputRemove: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onLocktimeClick?: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onSendMaxClick?: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onItemChange: React.EventHandler<React.SyntheticEvent<HTMLInputElement>>
  isMainnet: boolean
}

const SendFieldset = ({
  idx,
  item,
  errors,
  isSendMax,
  isMaxBtnDisabled,
  isMaxBtnShow,
  isRemoveBtnShow,
  onOutputRemove,
  onLocktimeClick,
  onSendMaxClick,
  onItemChange,
  isTimeLockable = true,
  isMainnet,
}: SendSubformProps) => {
  const [t] = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const removeRef = useRef<HTMLButtonElement | null>(null)

  const [amountErrorMsg, addrErrorMsg] = [errors.amountError, errors.addrError].map(err =>
    err ? t(err.message, err.i18n) : ''
  )

  let locktimeAble = false
  if (isTimeLockable && !addrErrorMsg && item.address) {
    try {
      if (isSecp256k1Address(item.address)) {
        locktimeAble = true
      }
    } catch {
      // ignore this
    }
  }

  return (
    <div className={styles.container}>
      <TextField
        className={`${styles.addresstField} ${styles.textFieldClass}`}
        rows={2}
        label={
          <div className={styles.removeLabel}>
            <div>{t('send.address')}</div>
            {isRemoveBtnShow && (
              <Button
                ref={removeRef}
                onClick={(e: React.SyntheticEvent<HTMLButtonElement>) => {
                  if (showDeleteDialog) {
                    onOutputRemove(e)
                  } else {
                    setShowDeleteDialog(true)
                  }
                }}
                data-idx={idx}
                disabled={isSendMax}
                className={styles.removeBtn}
                type="text"
              >
                <Trash />
              </Button>
            )}
          </div>
        }
        field="address"
        data-idx={idx}
        disabled={item.disabled}
        value={item.address || ''}
        onChange={onItemChange}
        error={addrErrorMsg}
        autoFocus
        width="100%"
      />

      <TextField
        className={styles.textFieldClass}
        label={t('send.amount')}
        field="amount"
        data-idx={idx}
        value={localNumberFormatter(item.amount)}
        placeholder={isSendMax ? PlaceHolders.send.Calculating : PlaceHolders.send.Amount}
        onChange={onItemChange}
        disabled={item.disabled}
        suffix={
          isMaxBtnShow && (
            <Button disabled={isMaxBtnDisabled} type="text" onClick={onSendMaxClick} className={styles.max}>
              Max
            </Button>
          )
        }
        error={amountErrorMsg}
        width="100%"
      />

      {locktimeAble && (
        <div className={styles.locktime}>
          {item.date ? (
            <div>
              <div className={styles.content}>
                <img className={styles.icon} src={TimeClock} alt="calendar" />
                <p>{`${t('send.release-on')}: ${formatDate(new Date(+item.date))}`}</p>
                <button type="button" onClick={onLocktimeClick}>
                  <Trash data-index={idx} data-type="remove" />
                </button>
              </div>
              <div className={styles.locktimeWarn}>
                <Attention />
                {t('send.locktime-warning', { extraNote: isMainnet ? null : t('messages.light-client-locktime-warning') })}
              </div>
            </div>
          ) : (
            <div className={styles.content}>
              <img className={styles.icon} src={TimeClock} alt="calendar" />
              <button type="button" data-index={idx} data-type="set" onClick={onLocktimeClick}>
                {t('send.set-locktime')}
              </button>
            </div>
          )}
        </div>
      )}

      <AlertDialog
        show={showDeleteDialog}
        title={t('send.remove-receiving-address')}
        message={t('send.remove-receiving-address-msg')}
        type="warning"
        onCancel={() => setShowDeleteDialog(false)}
        onOk={() => {
          removeRef?.current?.click()
          setShowDeleteDialog(false)
        }}
      />
    </div>
  )
}

SendFieldset.displayName = 'SendFieldset'

export default SendFieldset
