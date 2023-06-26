import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialog } from 'utils'
import Button from 'widgets/Button'
import Failed from 'widgets/Icons/Failed.png'
import Success from 'widgets/Icons/Success.png'
import Tips from 'widgets/Icons/Tips.png'
import styles from './alertDialog.module.scss'

type AlertType = 'success' | 'failed' | 'warning'

const AlertDialog = ({
  show,
  title,
  message,
  type,
  onClose,
  onOk,
  onCancel,
}: {
  show?: boolean
  title?: string
  message?: string
  type: AlertType
  onClose?: () => void
  onOk?: () => void
  onCancel?: () => void
}) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show, dialogRef, onClose: onClose || (() => {}) })

  return (
    <dialog ref={dialogRef} className={styles.alertDialog}>
      <>
        {type === 'failed' && <img src={Failed} alt="failed" className={styles.typeImg} />}
        {type === 'success' && <img src={Success} alt="success" className={styles.typeImg} />}
        {type === 'warning' && <img src={Tips} alt="warning" className={styles.typeImg} />}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
      </>
      <div className={styles.actions}>
        {type === 'failed' && <Button type="confirm" onClick={onCancel} label={t('common.back')} />}
        {type === 'success' && <Button type="confirm" onClick={onCancel || onOk} label={t('common.confirm')} />}
        {type === 'warning' && (
          <>
            <Button type="cancel" onClick={onCancel} label={t('common.cancel')} />
            <Button type="confirm" onClick={onOk} label={t('common.confirm')} />
          </>
        )}
      </div>
    </dialog>
  )
}

AlertDialog.displayName = 'AlertDialog'
export default AlertDialog
