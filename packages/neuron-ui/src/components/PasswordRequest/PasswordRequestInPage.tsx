import React from 'react'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import HardwareSignOnPage from 'components/HardwareSign/HardwareSignOnPage'
import { Export, Sign } from 'widgets/Icons/icon'
import { useState as useGlobalState } from 'states'
import { OfflineSignType } from 'services/remote'
import { useTranslation } from 'react-i18next'
import { useGoBack } from 'utils'
import usePasswordResuest from './hooks'
import styles from './passwordRequest.module.scss'

const PasswordRequestInPage = ({
  walletID = '',
  actionType = null,
  multisigConfig,
  onSuccess,
  onCancel,
}: State.PasswordRequest & { onCancel?: () => void }) => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
    },
    settings: { wallets = [] },
    experimental,
  } = useGlobalState()

  const [t] = useTranslation()
  const onGoBack = useGoBack()

  const {
    error,
    wallet,
    isLoading,
    signType,
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
    passwordRequest: { walletID, actionType, multisigConfig, onSuccess },
    wallets,
    experimental,
  })

  if (!wallet) {
    return null
  }

  if (wallet.device) {
    return (
      <HardwareSignOnPage
        signType="transaction"
        wallet={wallet}
        onDismiss={onCancel}
        offlineSignType={signType}
        walletID={walletID}
        actionType={actionType}
        multisigConfig={multisigConfig}
        onSuccess={onSuccess}
      />
    )
  }

  return (
    <div className={styles.passwordRequestInPage}>
      {wallet.isWatchOnly ? (
        <div className={styles.xpubNotice}>
          <Attention />
          {t('password-request.xpub-notice')}
        </div>
      ) : (
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
      <div className={styles.actions}>
        <Button type="cancel" onClick={onCancel || onGoBack} label={t('common.cancel')} />
        <Button type="submit" label={t('common.confirm')} loading={isLoading} disabled={disabled} onClick={onSubmit} />
      </div>
    </div>
  )
}

PasswordRequestInPage.displayName = 'PasswordRequestInPage'
export default PasswordRequestInPage
