import React from 'react'
import Spinner from 'widgets/Spinner'
import Dialog from 'widgets/Dialog'
import styles from './loadingDialog.module.scss'

const LoadingDialog = ({ show, message }: { show: boolean; message: string }) => {
  return (
    <Dialog show={show} showHeader={false} showFooter={false}>
      <div className={styles.loadingDialog}>
        <Spinner size={3} />
        <p>{message}</p>
      </div>
    </Dialog>
  )
}

LoadingDialog.displayName = 'LoadingDialog'
export default LoadingDialog
