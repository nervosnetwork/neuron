import React from 'react'
import { Confirming } from 'widgets/Icons/icon'
import { useTranslation } from 'react-i18next'

import styles from './transactionStatusWrap.module.scss'

export type TransactionStatusWrapProps = {
  status: 'pending' | 'confirming' | 'success' | 'failed'
  confirmationCount?: number
}

const TransactionStatusWrap = ({ status, confirmationCount }: TransactionStatusWrapProps) => {
  const [t] = useTranslation()

  const confirmationLabel = t('confirmationsCount', {
    count: confirmationCount,
  })

  return (
    <div className={styles.offsetConfirming}>
      {status === 'confirming' ? <Confirming className={styles.confirm} /> : null}
      <span className={styles.statusText}>{t(`transaction-status.${status}`)}</span>
      {confirmationCount && status === 'confirming' ? (
        <span className={styles.confirmationLabel}>{confirmationLabel}</span>
      ) : null}
    </div>
  )
}

TransactionStatusWrap.displayName = 'TransactionStatusWrap'

export default TransactionStatusWrap
