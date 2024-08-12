import React, { useCallback, useEffect, useState } from 'react'
import Dialog from 'widgets/Dialog'
import Hardware from 'widgets/Icons/Hardware.png'
import Button from 'widgets/Button'
import { useHardWallet, usePassword } from 'components/CellManagement/hooks'
import Alert from 'widgets/Alert'
import TextField from 'widgets/TextField'
import { useTranslation } from 'react-i18next'
import styles from './lockWindow.module.scss'

const VerifyWallet = ({
  wallet,
  show,
  onCancel,
  onConfirm,
}: {
  wallet: State.Wallet
  show: boolean
  onCancel: () => void
  onConfirm: (password?: string) => Promise<void>
}) => {
  const [t] = useTranslation()
  const [loading, setLoading] = useState(false)
  const {
    isReconnecting,
    isNotAvailable,
    reconnect,
    verifyDeviceStatus,
    errorMessage: hardwalletError,
    setError: setHardwalletError,
  } = useHardWallet({
    wallet,
    t,
  })
  const { password, error, onPasswordChange, setError, resetPassword } = usePassword()
  useEffect(() => {
    if (show) {
      resetPassword()
    }
  }, [show, resetPassword])
  useEffect(() => {
    if (show && wallet.device) {
      verifyDeviceStatus()
    }
  }, [show, wallet.device, verifyDeviceStatus])
  const onConfirmWrapper = useCallback(() => {
    setLoading(true)
    onConfirm(wallet.device ? undefined : password)
      .catch(err => {
        if (wallet.device) {
          setHardwalletError(err.message)
        } else {
          setError(err.message)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [wallet.device, onConfirm, setLoading, setHardwalletError, setError, password])
  if (wallet.device) {
    return (
      <Dialog
        show={show}
        title={`${t(`lock-window.verify-wallet`)}-${wallet.name}`}
        onCancel={onCancel}
        onConfirm={onConfirmWrapper}
        showFooter={false}
        className={styles.verifyWallet}
      >
        <div>
          <img src={Hardware} alt="hard-wallet" className={styles.hardWalletImg} />
        </div>
        <div className={styles.lockActions}>
          <Button
            onClick={isNotAvailable ? reconnect : onConfirmWrapper}
            loading={loading || isReconnecting}
            type="primary"
          >
            {isNotAvailable || isReconnecting
              ? t('hardware-verify-address.actions.reconnect')
              : t('cell-manage.verify')}
          </Button>
        </div>
        {hardwalletError ? (
          <Alert status="error" className={styles.hardwalletErr}>
            {hardwalletError}
          </Alert>
        ) : null}
      </Dialog>
    )
  }
  return (
    <Dialog
      show={show}
      title={`${t(`lock-window.verify-wallet`)}-${wallet.name}`}
      onCancel={onCancel}
      onConfirm={onConfirmWrapper}
      showCancel={false}
      className={styles.verifyWallet}
      isLoading={loading}
    >
      <TextField
        className={styles.passwordInput}
        placeholder={t('cell-manage.password-placeholder')}
        width="100%"
        label={t('cell-manage.enter-password')}
        value={password}
        field="password"
        type="password"
        title={t('cell-manage.enter-password')}
        onChange={onPasswordChange}
        autoFocus
        error={error}
      />
    </Dialog>
  )
}

VerifyWallet.displayName = 'VerifyWallet'

export default VerifyWallet
