import React, { useEffect, useMemo } from 'react'
import { Slider } from 'office-ui-fabric-react'
import { useTranslation, Trans } from 'react-i18next'
import TextField from 'widgets/TextField'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import { openExternal } from 'services/remote'
import { CONSTANTS, localNumberFormatter, shannonToCKBFormatter } from 'utils'
import { Attention, Success } from 'widgets/Icons/icon'
import Dialog from 'widgets/Dialog'
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

  return (
    <Dialog
      show={show}
      title={t('nervos-dao.deposit')}
      disabled={disabled}
      onCancel={onDismiss}
      onConfirm={onSubmit}
      cancelText={t('nervos-dao.cancel')}
      confirmText={t('nervos-dao.proceed')}
    >
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <form>
          <label className={styles.depositValueLabel} htmlFor="depositValue">{`${t(
            'nervos-dao.deposit-amount'
          )}`}</label>
          <Slider
            className={styles.slider}
            value={value}
            min={0}
            max={maxValue}
            step={1}
            showValue={false}
            onChange={onSlide}
          />
          <TextField
            className={styles.depositValue}
            width="100%"
            field="depositValue"
            value={localNumberFormatter(value)}
            onChange={onChange}
            suffix="CKB"
            required
            error={errorMessage}
          />

          <div className={styles.fee}>
            <div className={styles.isBalanceReserved}>
              <input
                type="checkbox"
                id="is-balance-reserved"
                checked={!isBalanceReserved}
                onChange={onIsBalanceReservedChange}
              />
              <label htmlFor="is-balance-reserved">
                <Success />
                {t(`nervos-dao.balance-not-reserved`)}
              </label>
            </div>

            <div>
              <span>{t('nervos-dao.fee')}</span>
              <span>{`${shannonToCKBFormatter(fee)}`}</span>
            </div>
          </div>

          <div className={styles.notice}>
            <Attention />
            <div>
              <Trans i18nKey="nervos-dao.deposit-terms" components={[rfcLink]} />
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
