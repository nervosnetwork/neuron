import React, { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { dismissAlertDialog } from 'states/stateProvider/actionCreators'
import { AppActions } from 'states/stateProvider/reducer'
import { useDialog } from 'utils'
import Button from 'widgets/Button'
import styles from './alertDialog.module.scss'

const AlertDialog = ({
  content,
  dispatch,
}: {
  content: { title: string; message: string } | null
  dispatch: React.Dispatch<{ type: AppActions.UpdateAlertDialog; payload: null }>
}) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const onDismiss = useCallback(() => {
    dismissAlertDialog()(dispatch)
  }, [dispatch])
  useDialog({ show: content, dialogRef, onClose: onDismiss })

  return (
    <dialog ref={dialogRef} className={styles.alertDialog}>
      {content ? (
        <>
          <h2 className={styles.title}>{content.title}</h2>
          <p className={styles.message}>{content.message}</p>
        </>
      ) : null}
      <div className={styles.actions}>
        <Button type="confirm" onClick={onDismiss} label={t('common.confirm')} />
      </div>
    </dialog>
  )
}

AlertDialog.displayName = 'AlertDialog'
export default AlertDialog
