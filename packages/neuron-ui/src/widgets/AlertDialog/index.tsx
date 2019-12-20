import React, { useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { dismissAlertDialog } from 'states/stateProvider/actionCreators'
import { AppActions } from 'states/stateProvider/reducer'
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

  useEffect(() => {
    if (dialogRef.current) {
      if (content && !dialogRef.current.open) {
        dialogRef.current.showModal()
      } else {
        dialogRef.current.close()
      }
    }
  }, [content, dialogRef])

  const onDismiss = useCallback(() => {
    dismissAlertDialog()(dispatch)
  }, [dispatch])

  return (
    <dialog ref={dialogRef} className={styles.alertDialog}>
      {content ? (
        <>
          <h2 className={styles.title}>{content.title}</h2>
          <p className={styles.message}>{content.message}</p>
        </>
      ) : null}
      <div className={styles.actions}>
        <button type="button" onClick={onDismiss}>
          {t('common.confirm')}
        </button>
      </div>
    </dialog>
  )
}

AlertDialog.displayName = 'AlertDialog'
export default AlertDialog
