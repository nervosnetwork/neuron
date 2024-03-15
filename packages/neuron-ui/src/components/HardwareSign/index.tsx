import React, { useCallback } from 'react'
import { AppActions, useDispatch, useState as useGlobalState } from 'states'
import { errorFormatter } from 'utils'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import Button from 'widgets/Button'
import { Export, Sign } from 'widgets/Icons/icon'
import { useTranslation } from 'react-i18next'
import HDWalletSign from '../HDWalletSign'
import styles from './hardwareSign.module.scss'
import useHardwareSign, { HardwareSignProps } from './hooks'

const HardwareSign = ({
  signType,
  signMessage,
  wallet,
  onDismiss,
  offlineSignJSON,
  offlineSignType,
}: HardwareSignProps) => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest,
    },
    experimental,
  } = useGlobalState()
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const onCancel = useCallback(
    (dismiss: boolean = true) => {
      if (signType === 'transaction') {
        dispatch({
          type: AppActions.UpdateLoadings,
          payload: { sending: false },
        })
      }
      if (dismiss) {
        onDismiss?.()
      }
    },
    [dispatch, signType, onDismiss]
  )
  const {
    offlineSignActionType,
    status,
    error,
    isLoading,
    isNotAvailableToSign,
    productName,
    signAndExportFromGenerateTx,
    sign,
    reconnect,
    exportTransaction,
  } = useHardwareSign({
    signType,
    signMessage,
    wallet,
    offlineSignJSON,
    offlineSignType,
    description,
    generatedTx,
    isSending,
    passwordRequest,
    experimental,
    onCancel,
  })
  if (error) {
    return <AlertDialog show message={errorFormatter(error, t)} type="failed" onCancel={onCancel} />
  }

  return (
    <Dialog
      show
      title={t('hardware-sign.title')}
      onCancel={onCancel}
      showConfirm={(passwordRequest.actionType || offlineSignActionType) !== 'send-from-multisig'}
      confirmText={isNotAvailableToSign ? t('hardware-sign.actions.rescan') : t('sign-and-verify.sign')}
      isLoading={isLoading}
      onConfirm={isNotAvailableToSign ? reconnect : sign}
    >
      <div className={styles.container}>
        <p>
          {t('hardware-sign.device')}
          <span>{productName}</span>
        </p>
        <p>
          {t('hardware-sign.status.label')}
          <span className={isNotAvailableToSign ? styles.warning : ''}>{status}</span>
        </p>

        <div>{wallet.isHD && generatedTx ? <HDWalletSign tx={generatedTx} /> : null}</div>

        {offlineSignJSON === undefined && signType === 'transaction' ? (
          <div className={styles.footer}>
            <Button type="text" onClick={exportTransaction} disabled={isLoading}>
              {t('offline-sign.export')} <Export />
            </Button>
            <div className={styles.divider} />
            <Button
              type="text"
              className={styles.signAndExportFromGenerateTx}
              onClick={signAndExportFromGenerateTx}
              disabled={isNotAvailableToSign}
              loading={!isNotAvailableToSign && isLoading}
            >
              {t('offline-sign.sign-and-export')} <Sign />
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}

HardwareSign.displayName = 'HardwareSign'

export default HardwareSign
