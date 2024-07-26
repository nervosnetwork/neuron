import React, { useEffect, useCallback, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { clsx, useDialogWrapper } from 'utils'
import { Close } from 'widgets/Icons/icon'
import styles from './dialog.module.scss'

interface DialogProps {
  show: boolean
  title?: string | ReactNode
  subTitle?: string
  onConfirm?: (e: React.FormEvent) => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  disabled?: boolean | undefined
  children?: React.ReactNode
  isLoading?: boolean
  confirmProps?: object
  cancelProps?: object
  showHeader?: boolean
  showConfirm?: boolean
  showCancel?: boolean
  showFooter?: boolean
  className?: string
  footer?: React.ReactChild
  contentClassName?: string
  enableCloseWithEsc?: boolean
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
  isLoading,
  confirmProps = {},
  cancelProps = {},
  showHeader = true,
  showConfirm = true,
  showCancel = true,
  className = '',
  contentClassName,
  showFooter = true,
  enableCloseWithEsc = true,
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

  const handleConfirm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      onConfirm?.(e)
    },
    [onConfirm, disabled]
  )

  if (!isDialogOpen) {
    return null
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialogWrap} ${className}`}
      onKeyDown={e => {
        if (e.key === 'Escape' && enableCloseWithEsc) {
          onCancel?.()
        } else if (e.key === 'Enter' && showFooter && showConfirm) {
          handleConfirm(e)
        }
      }}
      role="none"
    >
      {showHeader ? (
        <div className={styles.header}>
          <div className={styles.title}>
            {title}
            {subTitle ? <span className={styles.subTitle}>{subTitle}</span> : null}
          </div>
          <Close onClick={onCancel} />
        </div>
      ) : null}
      <div className={clsx(styles.content, contentClassName)}>{children}</div>
      {showFooter ? (
        <div className={styles.footerWrap}>
          <form className={styles.footer}>
            {showCancel ? (
              <Button
                type="cancel"
                onClick={onCancel || closeDialog}
                label={cancelText || t('common.cancel')}
                {...cancelProps}
              />
            ) : null}
            {showConfirm ? (
              <Button
                type="submit"
                label={confirmText || t('common.confirm')}
                loading={isLoading}
                disabled={disabled}
                onClick={handleConfirm}
                {...confirmProps}
              />
            ) : null}
          </form>
        </div>
      ) : null}
    </dialog>
  )
}

Dialog.displayName = 'Dialog'

export default Dialog
