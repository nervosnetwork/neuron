import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import UnlockSuccessIcon from 'widgets/Icons/UnlockSuccess.png'
import styles from './globalDialog.module.scss'

const UnlockSuccess = () => {
  const [t] = useTranslation()
  return (
    <>
      <img src={UnlockSuccessIcon} alt="unlock-success" />
      <span>{t('special-assets.release-success')}</span>
    </>
  )
}

const RebuildSync = ({ onDismiss, onOk }: { onDismiss: React.MouseEventHandler; onOk: React.MouseEventHandler }) => {
  const [t] = useTranslation()
  return (
    <div style={{ fontWeight: 200 }}>
      {t('messages.rebuild-sync')
        .split('\n')
        .map(s => (
          <p key={s}>{s}</p>
        ))}
      <div className={styles.rebuildFooter}>
        <Button type="primary" label={t('common.cancel')} onClick={onDismiss} />
        <Button type="primary" label={t('messages.migrate')} onClick={onOk} />
      </div>
    </div>
  )
}

interface GlobalDialogProps {
  onDismiss: React.MouseEventHandler
  onOk: React.MouseEventHandler
  type: State.GlobalDialogType
}

const GlobalDialog = ({ onDismiss, type, onOk }: GlobalDialogProps) => {
  let content = null
  switch (type) {
    case 'unlock-success': {
      content = <UnlockSuccess />
      break
    }
    case 'rebuild-sync': {
      content = <RebuildSync onDismiss={onDismiss} onOk={onOk} />
      break
    }
    default: {
      return null
    }
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
        {content}
      </div>
    </div>
  )
}

GlobalDialog.displayName = 'GlobalDialog'
export default GlobalDialog
