import React, { useEffect, useCallback, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { useDialogWrapper } from 'utils'
import { Close } from 'widgets/Icons/icon'
import styles from './dialog.module.scss'

interface DialogProps {
  show: boolean
  title?: string | ReactNode
  subTitle?: string
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  disabled?: boolean | undefined
  children?: React.ReactChild
  footer?: React.ReactNode
  isLoading?: boolean
}

const Dialog = ({
  show,
  title,
  subTitle,
  onConfirm,
  onCancel,
  disabled,
  confirmText,
  cancelText,
  children,
  footer,
  isLoading,
}: DialogProps) => {
  const [t] = useTranslation()
  const { isDialogOpen, openDialog, closeDialog, dialogRef } = useDialogWrapper({ onClose: onCancel })

  useEffect(() => {
    if (show) {
      openDialog()
    } else {
      closeDialog()
    }
  }, [show])

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      if (onConfirm) {
        onConfirm()
      }
    },
    [onConfirm, disabled]
  )

  if (!isDialogOpen) {
    return null
  }

  return (
    <dialog ref={dialogRef} className={styles['n-dialog']}>
      <div className={styles.header}>
        <div className={styles.title}>
          {title}
          <span className={styles.subTitle}>{subTitle}</span>
        </div>
        <Close onClick={onCancel} />
      </div>
      <form onSubmit={onSubmit}>
        <div className={styles.content}>{children}</div>
        {footer ? (
          { footer }
        ) : (
          <div className={styles.footer}>
            <Button type="cancel" onClick={onCancel || closeDialog} label={cancelText || t('nervos-dao.cancel')} />
            <Button
              type="submit"
              label={confirmText || t('nervos-dao.proceed')}
              loading={isLoading}
              disabled={disabled}
            />
          </div>
        )}
      </form>
    </dialog>
  )
}

Dialog.displayName = 'Dialog'

export default Dialog
