import React from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { errorFormatter, useGoBack } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import Button from 'widgets/Button'
import { Export, Sign } from 'widgets/Icons/icon'
import HDWalletSign from '../HDWalletSign'
import useHardwareSign, { HardwareSignProps } from './hooks'
import styles from './hardwareSign.module.scss'

const HardwareSignOnPage = ({
  signType,
  signMessage,
  wallet,
  onDismiss,
  offlineSignJSON,
  offlineSignType,
  walletID,
  actionType,
  multisigConfig,
  onSuccess,
}: HardwareSignProps & State.PasswordRequest) => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
    },
    experimental,
  } = useGlobalState()
  const [t] = useTranslation()
  const onGoBack = useGoBack()
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
    passwordRequest: { walletID, actionType, multisigConfig, onSuccess },
    experimental,
  })

  if (error) {
    return <AlertDialog show message={errorFormatter(error, t)} type="failed" onCancel={onDismiss || onGoBack} />
  }

  return (
    <div title={t('hardware-sign.title')} className={styles.hardwareSignInPage}>
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
      <div className={styles.actions}>
        <Button type="cancel" onClick={onDismiss || onGoBack} label={t('common.cancel')} />
        {(actionType || offlineSignActionType) !== 'send-from-multisig' ? (
          <Button
            type="submit"
            label={isNotAvailableToSign ? t('hardware-sign.actions.rescan') : t('sign-and-verify.sign')}
            loading={isLoading}
            disabled={isLoading}
            onClick={isNotAvailableToSign ? reconnect : sign}
          />
        ) : null}
      </div>
    </div>
  )
}

HardwareSignOnPage.displayName = 'HardwareSignOnPage'

export default HardwareSignOnPage
