import React, { useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { dismissAlertDialog } from 'states/stateProvider/actionCreators'
import { AppActions } from 'states/stateProvider/reducer'
import * as styles from './alertDialog.module.scss'

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
      if (content) {
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
          <div className={styles.title}>{content.title}</div>
          <div className={styles.message}>{content.message}</div>
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
