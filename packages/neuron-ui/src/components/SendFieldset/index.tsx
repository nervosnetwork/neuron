import React from 'react'
import { useTranslation } from 'react-i18next'

import TextField from 'widgets/TextField'
import Button from 'widgets/Button'

import AddOutput from 'widgets/Icons/AddOutput.png'
import RemoveOutput from 'widgets/Icons/RemoveOutput.png'
import Edit from 'widgets/Icons/Edit.png'
import ActiveEdit from 'widgets/Icons/ActiveEdit.png'
import Trash from 'widgets/Icons/Trash.png'
import ActiveTrash from 'widgets/Icons/ActiveTrash.png'
import Calendar from 'widgets/Icons/Calendar.png'
import ActiveCalendar from 'widgets/Icons/ActiveCalendar.png'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'

import { formatDate } from 'widgets/DatetimePicker'
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
  isAddOneBtnDisabled: boolean
  isAddBtnShow: boolean
  isRemoveBtnShow: boolean
  isTimeLockable?: boolean
  onOutputAdd: () => void
  onOutputRemove: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onLocktimeClick?: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onSendMaxClick?: React.EventHandler<React.SyntheticEvent<HTMLButtonElement>>
  onItemChange: React.EventHandler<React.SyntheticEvent<HTMLInputElement>>
}

const SendFieldset = ({
  idx,
  item,
  errors,
  isSendMax,
  isMaxBtnDisabled,
  isMaxBtnShow,
  isAddOneBtnDisabled,
  isAddBtnShow,
  isRemoveBtnShow,
  onOutputAdd,
  onOutputRemove,
  onLocktimeClick,
  onSendMaxClick,
  onItemChange,
  isTimeLockable = true,
}: SendSubformProps) => {
  const [t] = useTranslation()

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
        className={styles.addressField}
        label={t('send.address')}
        field="address"
        data-idx={idx}
        disabled={item.disabled}
        value={item.address || ''}
        onChange={onItemChange}
        required
        error={addrErrorMsg}
        autoFocus
      />

      <TextField
        className={styles.amountField}
        label={t('send.amount')}
        field="amount"
        data-idx={idx}
        value={localNumberFormatter(item.amount)}
        placeholder={isSendMax ? PlaceHolders.send.Calculating : PlaceHolders.send.Amount}
        onChange={onItemChange}
        disabled={item.disabled}
        required
        suffix="CKB"
        error={amountErrorMsg}
      />

      {isMaxBtnShow ? (
        <Button
          className={styles.maxBtn}
          type="primary"
          onClick={onSendMaxClick}
          disabled={isMaxBtnDisabled}
          label="Max"
          data-is-on={isSendMax}
        />
      ) : null}

      <div className={styles.iconBtns}>
        {isRemoveBtnShow ? (
          <button
            type="button"
            disabled={isSendMax}
            aria-label={t('send.remove-this')}
            data-idx={idx}
            onClick={onOutputRemove}
            className={styles.iconBtn}
          >
            <img src={RemoveOutput} alt="Remove Output" data-type="remove" />
          </button>
        ) : null}
        {isAddBtnShow ? (
          <button
            type="button"
            disabled={isAddOneBtnDisabled}
            onClick={onOutputAdd}
            aria-label={t('send.add-one')}
            className={styles.iconBtn}
          >
            <img src={AddOutput} alt="Add Output" data-type="add" />
          </button>
        ) : null}
      </div>

      {locktimeAble ? (
        <div className={styles.locktime} data-status={item.date ? 'set' : 'unset'}>
          <img data-status="inactive" className={styles.icon} src={Calendar} alt="calendar" />
          <img data-status="active" className={styles.icon} src={ActiveCalendar} alt="active-calendar" />
          {item.date ? `${t('send.release-on')}: ${formatDate(new Date(+item.date))}` : null}
          <button type="button" data-index={idx} data-type="set" onClick={onLocktimeClick}>
            {item.date ? (
              <>
                <img data-status="inactive" className={styles.icon} src={Edit} alt="edit" />
                <img data-status="active" className={styles.icon} src={ActiveEdit} alt="active-edit" />
              </>
            ) : (
              t('send.set-locktime')
            )}
          </button>
          {item.date ? (
            <button type="button" data-index={idx} data-type="remove" onClick={onLocktimeClick}>
              <img data-status="inactive" className={styles.icon} src={Trash} alt="trash" />
              <img data-status="active" className={styles.icon} src={ActiveTrash} alt="active-trash" />
            </button>
          ) : null}
          {item.date && (
            <div className={styles.locktimeWarn}>
              <Attention />
              {t('send.locktime-warning')}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

SendFieldset.displayName = 'SendFieldset'

export default SendFieldset
