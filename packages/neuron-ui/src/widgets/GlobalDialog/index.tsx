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

const RebuildSync = ({
  onDismiss,
  onBackUp,
  onOk,
}: {
  onDismiss: React.MouseEventHandler
  onBackUp: React.MouseEventHandler
  onOk: React.MouseEventHandler
}) => {
  const [t] = useTranslation()
  return (
    <div style={{ fontWeight: 200 }}>
      {t('messages.rebuild-sync')
        .split('\n')
        .map((s: string) => (
          <p key={s}>{s}</p>
        ))}
      <p>{t('messages.migrate-warning')}</p>
      <div style={{ textAlign: 'right' }}>
        <Button type="cancel" label={t('common.cancel')} onClick={onDismiss} style={{ marginRight: '24px' }} />
        <Button type="primary" label={t('common.backup')} onClick={onBackUp} style={{ marginRight: '24px' }} />
        <Button type="primary" label={t('messages.migrate')} onClick={onOk} />
      </div>
    </div>
  )
}

interface GlobalDialogProps {
  onDismiss: React.MouseEventHandler
  onOk: React.MouseEventHandler
  onBackUp: React.MouseEventHandler
  type: State.GlobalDialogType
}

const GlobalDialog = ({ onDismiss, type, onOk, onBackUp }: GlobalDialogProps) => {
  let content = null
  let maskClosable = true
  switch (type) {
    case 'unlock-success': {
      content = <UnlockSuccess />
      break
    }
    case 'rebuild-sync': {
      maskClosable = false
      content = <RebuildSync onDismiss={onDismiss} onOk={onOk} onBackUp={onBackUp} />
      break
    }
    default: {
      return null
    }
  }
  return (
    <div role="presentation" className={styles.dialogContainer} onClick={maskClosable ? onDismiss : undefined}>
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
