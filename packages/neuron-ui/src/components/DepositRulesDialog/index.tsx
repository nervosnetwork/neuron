import React from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import styles from './depositRulesDialog.module.scss'

const DepositRulesDialog = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  const [t] = useTranslation()

  return (
    <Dialog
      show={show}
      title={t('nervos-dao.deposit-rules')}
      onCancel={onClose}
      onConfirm={onClose}
      showCancel={false}
      confirmText={t('deposit-rules.get')}
      className={styles.container}
    >
      <div className={styles.content}>
        {[
          ['deposit-rules.minimum-deposit', '102 CKB'],
          ['deposit-rules.single-compensation-cycle', 'deposit-rules.single-compensation-cycle-description'],
          ['deposit-rules.withdraw', 'deposit-rules.withdraw-description'],
          ['deposit-rules.unlock', 'deposit-rules.unlock-description'],
        ].map(([title, description]) => (
          <div className={styles.item}>
            <p>{t(title)}</p>
            <p className={styles.description}>{t(description)}</p>
          </div>
        ))}
      </div>
    </Dialog>
  )
}

DepositRulesDialog.displayName = 'DepositRulesDialog'

export default DepositRulesDialog
