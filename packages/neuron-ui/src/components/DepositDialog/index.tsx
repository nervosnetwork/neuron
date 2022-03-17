import React, { useEffect, useMemo, useCallback, useRef } from 'react'
import { Slider, SpinnerSize } from 'office-ui-fabric-react'
import { useTranslation, Trans } from 'react-i18next'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import Button from 'widgets/Button'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { openExternal } from 'services/remote'
import { CONSTANTS, localNumberFormatter, shannonToCKBFormatter, useDialog } from 'utils'
import styles from './depositDialog.module.scss'

const { SHANNON_CKB_RATIO } = CONSTANTS

const NERVOS_DAO_RFC_URL =
  'https://www.github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md'

interface DepositDialogProps {
  show: boolean
  value: any
  fee: string
  onOpen: () => void
  onDismiss: () => void
  onChange: (e: React.SyntheticEvent<HTMLInputElement, Event>) => void
  onSubmit: () => void
  onSlide: (value: number) => void
  maxDepositAmount: bigint
  isDepositing: boolean
  errorMessage: string
  isTxGenerated: boolean
  isBalanceReserved: boolean
  onIsBalanceReservedChange: (e: React.SyntheticEvent<HTMLInputElement>) => void
}

const DepositDialog = ({
  show,
  value,
  fee,
  maxDepositAmount,
  onChange,
  onSlide,
  onSubmit,
  onOpen,
  onDismiss,
  isDepositing,
  errorMessage,
  isTxGenerated,
  isBalanceReserved,
  onIsBalanceReservedChange,
}: DepositDialogProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show, dialogRef, onClose: onDismiss })

  useEffect(() => {
    if (show) {
      onOpen()
    }
  }, [onOpen, show])

  const rfcLink = useMemo(
    () => (
      <button
        type="button"
        onClick={() => {
          openExternal(NERVOS_DAO_RFC_URL)
        }}
        className={styles.rfcLink}
        aria-label="Nervos DAO RFC"
        title="Nervos DAO RFC"
      />
    ),
    []
  )
  const maxValue = +(maxDepositAmount / BigInt(SHANNON_CKB_RATIO)).toString()
  const disabled = !isTxGenerated

  const onConfirm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      onSubmit()
    },
    [onSubmit, disabled]
  )

  if (!show) {
    return null
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <form onSubmit={onConfirm}>
          <h2 title={t('nervos-dao.deposit-dialog-title`')} className={styles.title}>
            {t('nervos-dao.deposit-dialog-title')}
          </h2>
          <TextField
            field="depositValue"
            label={`${t('nervos-dao.deposit')}`}
            value={localNumberFormatter(value)}
            onChange={onChange}
            suffix="CKB"
            required
            error={errorMessage}
          />
          <Slider value={value} min={0} max={maxValue} step={1} showValue={false} onChange={onSlide} />
          <div className={styles.isBalanceReserved}>
            <input
              type="checkbox"
              id="is-balance-reserved"
              checked={!isBalanceReserved}
              onChange={onIsBalanceReservedChange}
            />
            <label htmlFor="is-balance-reserved">{t(`nervos-dao.balance-not-reserved`)}</label>
          </div>
          <div className={styles.notice}>
            <Attention />
            <Trans i18nKey="nervos-dao.deposit-terms" components={[rfcLink]} />
          </div>
          <div className={styles.fee}>
            <span>{t('nervos-dao.fee')}</span>
            <span>{`${shannonToCKBFormatter(fee)}`}</span>
          </div>
          <div className={styles.footer}>
            <Button type="cancel" onClick={onDismiss} label={t('nervos-dao.cancel')} />
            <Button type="submit" label={t('nervos-dao.proceed')} disabled={disabled} />
          </div>
        </form>
      )}
    </dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
