import React from 'react'
import { useTranslation } from 'react-i18next'
import UnlockSuccessIcon from 'widgets/Icons/UnlockSuccess.png'
import styles from './globalDialog.module.scss'

const GlobalDialog = ({ onDismiss, type }: { onDismiss: React.MouseEventHandler; type: 'unlock-success' | null }) => {
  const [t] = useTranslation()
  if (!type) {
    return null
  }
  return (
    <div role="presentation" className={styles.dialogContainer} onClick={onDismiss}>
      <div
        role="presentation"
        className={styles.dialog}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <img src={UnlockSuccessIcon} alt="unlock-success" />
        <span>{t('special-assets.release-success')}</span>
      </div>
    </div>
  )
}

GlobalDialog.displayName = 'GlobalDialog'
export default GlobalDialog
