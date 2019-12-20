import React, { useMemo, useRef } from 'react'
import { TextField, Slider, Spinner, SpinnerSize } from 'office-ui-fabric-react'
import { useTranslation, Trans } from 'react-i18next'
import { SHANNON_CKB_RATIO, NERVOS_DAO_RFC_URL } from 'utils/const'
import { openExternal } from 'services/remote'
import { localNumberFormatter } from 'utils/formatters'
import { useDialog } from 'utils/hooks'
import styles from './depositDialog.module.scss'

interface DepositDialogProps {
  show: boolean
  value: any
  fee: string
  onDismiss: () => void
  onChange: any
  onSubmit: () => void
  onSlide: (value: number) => void
  maxDepositAmount: bigint
  isDepositing: boolean
  errorMessage: string
}

const DepositDialog = ({
  show,
  value,
  fee,
  maxDepositAmount,
  onChange,
  onSlide,
  onSubmit,
  onDismiss,
  isDepositing,
  errorMessage,
}: DepositDialogProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show, dialogRef })

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

  if (!show) {
    return null
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <>
          <h2 title={t('nervos-dao.deposit-dialog-title`')} className={styles.title}>
            {t('nervos-dao.deposit-dialog-title')}
          </h2>
          <TextField
            label={`${t('nervos-dao.deposit')}*`}
            value={localNumberFormatter(value)}
            onChange={onChange}
            suffix="CKB"
          />
          <Slider value={value} min={0} max={maxValue} step={1} showValue={false} onChange={onSlide} />
          <div className={styles.fee}>
            <span>{t('nervos-dao.fee')}</span>
            <span>{fee}</span>
          </div>
          <div className={styles.errorMessage}>{errorMessage}</div>
          <div className={styles.notice}>
            <h2 aria-label={t('nervos-dao.notice')}>{t('nervos-dao.notice')}</h2>
            <p>
              <Trans i18nKey="nervos-dao.deposit-terms" components={[rfcLink]} />
            </p>
          </div>
          <div className={styles.footer}>
            <button type="button" aria-label={t('nervos-dao.cancel')} onClick={onDismiss} className={styles.cancel}>
              {t('nervos-dao.cancel')}
            </button>
            <button type="submit" aria-label={t('nervos-dao.proceed')} onClick={onSubmit} className={styles.submit}>
              {t('nervos-dao.proceed')}
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
