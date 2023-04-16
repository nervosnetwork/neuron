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
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  disabled?: boolean | undefined
  children?: React.ReactChild
  isLoading?: boolean
  confirmProps?: object
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

  const onDialogClicked = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target instanceof HTMLDialogElement && e.target.tagName === 'DIALOG') {
        onCancel?.()
      }
    },
    [onCancel]
  )

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      onConfirm?.()
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
      onClick={onDialogClicked}
      onKeyDown={e => (e.key === 'Escape' && enableCloseWithEsc ? onCancel : undefined)}
      role="none"
    >
      {showHeader ? (
        <div className={styles.header}>
          <div className={styles.title}>
            {title}
            <span className={styles.subTitle}>{subTitle}</span>
          </div>
          <Close onClick={onCancel} />
        </div>
      ) : null}
      <div className={clsx(styles.content, contentClassName)}>{children}</div>
      {showFooter ? (
        <form onSubmit={onSubmit}>
          <div className={styles.footer}>
            {showCancel ? (
              <Button type="cancel" onClick={onCancel || closeDialog} label={cancelText || t('common.cancel')} />
            ) : null}
            {showConfirm ? (
              <Button
                type="submit"
                label={confirmText || t('common.confirm')}
                loading={isLoading}
                disabled={disabled}
                {...confirmProps}
              />
            ) : null}
          </div>
        </form>
      ) : null}
    </dialog>
  )
}

Dialog.displayName = 'Dialog'

export default Dialog
