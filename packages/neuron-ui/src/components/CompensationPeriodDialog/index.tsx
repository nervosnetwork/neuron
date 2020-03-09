import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { useDialog } from 'utils/hooks'
import { WITHDRAW_EPOCHS } from 'utils/const'

import styles from './compensationPeriodDialog.module.scss'

interface CompensationPeriodDialogProps {
  onDismiss: () => void
  compensationPeriod: {
    currentEpochValue: number
    targetEpochValue: number
  } | null
}

const CompensationPeriodDialog = ({ onDismiss, compensationPeriod }: CompensationPeriodDialogProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: compensationPeriod, dialogRef, onClose: onDismiss })

  const pastEpochs = compensationPeriod
    ? +(compensationPeriod.currentEpochValue - compensationPeriod.targetEpochValue + WITHDRAW_EPOCHS).toFixed(1)
    : 0

  const totalHours = Math.ceil((WITHDRAW_EPOCHS - pastEpochs) * 4)
  const leftDays = Math.floor(totalHours / 24)
  const leftHours = totalHours % 24

  return (
    <dialog ref={dialogRef} className={styles.compensationPeriodDialog}>
      <h2 className={styles.title}>{t('nervos-dao.current-epochs-period')}</h2>
      <div className={styles.stage}>
        <span>{t('nervos-dao.progress')}</span>
        <span>{t('nervos-dao.stage-of-current-epoch', { pastEpochs, totalEpochs: 180 })}</span>
      </div>
      <div className={styles.leftTime}>{t('nervos-dao.left-time', { leftDays, leftHours })}</div>
      <progress className={styles.epochsProgress} max="180" value={pastEpochs} />
      <p className={styles.notes}>{t('nervos-dao.detailed-explanation-of-epochs-period')}</p>
      <ul className={styles.terms}>
        {t('nervos-dao.terms-in-explanation-of-epochs-period')
          .split('\n')
          .map(term => {
            return <li key={term}>{term}</li>
          })}
      </ul>
      <div className={styles.actions}>
        <Button type="ok" onClick={onDismiss} label={t('common.ok')} />
      </div>
    </dialog>
  )
}

CompensationPeriodDialog.displayName = 'CompensationPeriodDialog'
export default CompensationPeriodDialog
