import React, { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialog, clsx } from 'utils'
import Button from 'widgets/Button'
import Failed from 'widgets/Icons/Failed.png'
import Success from 'widgets/Icons/Success.png'
import Tips from 'widgets/Icons/Tips.png'
import styles from './alertDialog.module.scss'

type AlertType = 'success' | 'failed' | 'warning'
type Action = 'ok' | 'cancel' | 'all'

const AlertDialog = ({
  show,
  title,
  message,
  type,
  onOk,
  onCancel,
  action,
  okText,
  disabled,
  cancelText,
  cancelProps,
  okProps,
  className,
}: {
  show?: boolean
  title?: string
  message?: React.ReactNode
  type: AlertType
  onOk?: () => void
  onCancel?: () => void
  action?: Action
  okText?: string
  disabled?: boolean
  cancelText?: string
  cancelProps?: object
  okProps?: object
  className?: string
}) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show, dialogRef, onClose: onCancel || (() => {}) })
  const actions = useMemo<('cancel' | 'ok')[]>(() => {
    if (action) {
      return action === 'all' ? ['cancel', 'ok'] : [action]
    }
    return type === 'warning' || onCancel ? ['cancel', 'ok'] : ['ok']
  }, [action, type, onCancel])

  return (
    <dialog ref={dialogRef} className={clsx(styles.alertDialog, className)}>
      {type === 'failed' && <img src={Failed} alt="failed" className={styles.typeImg} />}
      {type === 'success' && <img src={Success} alt="success" className={styles.typeImg} />}
      {type === 'warning' && <img src={Tips} alt="warning" className={styles.typeImg} />}
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.message}>{message}</div>
      <div className={styles.actions}>
        {actions.map(v =>
          v === 'cancel' ? (
            <Button
              key={v}
              type="cancel"
              onClick={onCancel}
              label={cancelText || t('common.cancel')}
              {...cancelProps}
            />
          ) : (
            <Button
              key={v}
              type="confirm"
              onClick={onOk || onCancel}
              label={okText || t('common.confirm')}
              disabled={disabled}
              {...okProps}
            />
          )
        )}
      </div>
    </dialog>
  )
}

AlertDialog.displayName = 'AlertDialog'
export default AlertDialog
