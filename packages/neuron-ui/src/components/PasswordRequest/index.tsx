import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import HardwareSign from 'components/HardwareSign'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import Dialog from 'widgets/Dialog'
import { Export, Sign } from 'widgets/Icons/icon'
import { AppActions, useDispatch, useState as useGlobalState } from 'states'
import { OfflineSignType } from 'services/remote'
import usePasswordResuest from './hooks'
import styles from './passwordRequest.module.scss'

const PasswordRequest = () => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest,
    },
    settings: { wallets = [] },
    experimental,
  } = useGlobalState()

  const [t] = useTranslation()
  const dispatch = useDispatch()
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
  }, [dispatch])

  const {
    error,
    wallet,
    isLoading,
    signType,
    actionType,
    title,
    disabled,
    password,
    onSubmit,
    onChange,
    exportTransaction,
    signAndExportFromGenerateTx,
  } = usePasswordResuest({
    description,
    generatedTx,
    isSending,
    passwordRequest,
    wallets,
    experimental,
    onDismiss,
  })
  if (!wallet) {
    return null
  }

  if (wallet.device) {
    return <HardwareSign signType="transaction" wallet={wallet} onDismiss={onDismiss} offlineSignType={signType} />
  }

  return (
    <Dialog
      show={!!actionType}
      title={t(title || `password-request.${actionType}.title`)}
      contentClassName={styles.content}
      onCancel={onDismiss}
      onConfirm={onSubmit}
      disabled={disabled}
      isLoading={isLoading}
      cancelText={t('common.cancel')}
      confirmText={t('common.confirm')}
      showConfirm={actionType !== 'send-from-multisig'}
    >
      <div>
        {[
          'unlock',
          'create-sudt-account',
          'send-sudt',
          'transfer-to-sudt',
          'send-acp-ckb-to-new-cell',
          'send-acp-sudt-to-new-cell',
          'send-cheque',
          'withdraw-cheque',
          'claim-cheque',
          'create-account-to-claim-cheque',
          'migrate-acp',
          'send-from-multisig-need-one',
          'send-from-multisig',
        ].includes(actionType ?? '') ? null : (
          <div className={styles.walletName}>{wallet ? wallet.name : null}</div>
        )}
        {wallet.isWatchOnly && (
          <div className={styles.xpubNotice}>
            <Attention />
            {t('password-request.xpub-notice')}
          </div>
        )}
        {wallet.isWatchOnly || (
          <TextField
            className={styles.passwordInput}
            placeholder={t('password-request.placeholder')}
            width="100%"
            label={t('password-request.password')}
            value={password}
            field="password"
            type="password"
            title={t('password-request.password')}
            onChange={onChange}
            autoFocus
            error={error}
          />
        )}
        {signType !== OfflineSignType.Invalid ? (
          <div className={styles.footer}>
            <Button type="text" onClick={exportTransaction} disabled={isLoading}>
              {t('offline-sign.export')} <Export />
            </Button>
            {!wallet.isWatchOnly && (
              <>
                <div className={styles.divider} />
                <Button
                  type="text"
                  className={styles.signAndExportFromGenerateTx}
                  onClick={signAndExportFromGenerateTx}
                  disabled={!password}
                  loading={isLoading}
                >
                  {t('offline-sign.sign-and-export')} <Sign />
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
