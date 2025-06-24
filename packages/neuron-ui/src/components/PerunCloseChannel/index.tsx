import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { showErrorMessage, signMessage, verifyMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  ErrorCode,
  isSuccessResponse,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  validateAddress,
  isMainnet as isMainnetUtil,
} from 'utils'
import { isErrorWithI18n } from 'exceptions'
import { useState as useGlobalState } from 'states'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import Alert from 'widgets/Alert'
import styles from './perunCloseChannel.module.scss'

const PerunCloseChannel = ({ onClose }: { onClose?: () => void }) => {
  const [t] = useTranslation()
  const [notification, setNotification] = useState<Notification>(null)
  const [failReason, setFailReason] = useState<string | undefined>('')
  const [showDialog, setShowDialog] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [address, setAddress] = useState('')
  const {
    chain: { networkID },
    settings: { networks },
    wallet,
  } = useGlobalState()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isMainnet = isMainnetUtil(networks, networkID)
  useExitOnWalletChange()

  const handlePasswordDialogDismiss = useCallback(() => {
    setShowDialog(true)
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  const handleVerifyMessage = useCallback(() => {
    verifyMessage({ message, signature, address })
      .then(res => {
        if (isSuccessResponse(res)) {
          if (res.result === 'old-sign') {
            setNotification('verify-old-sign-success')
          } else {
            setNotification('verify-success')
          }
        } else {
          setNotification('verify-failure')
          setShowDialog(false)
          if (typeof res.message === 'object') {
            setFailReason(res.message.content ?? '')
          }
        }
      })
      .catch((err: Error) => {
        showErrorMessage('Error', err.message)
      })
  }, [message, address, setNotification, signature])

  const handleSignMessage = useCallback(
    async (password: string) => {
      const res: ControllerResponse = await signMessage({
        walletID: wallet?.id ?? '',
        address,
        message,
        password,
      })
      if (isSuccessResponse(res)) {
        setSignature(res.result)
        handlePasswordDialogDismiss()
      } else if (res.status === ErrorCode.PasswordIncorrect) {
        // pass through this kind of error
      } else if (res.status === ErrorCode.AddressNotFound) {
        handlePasswordDialogDismiss()
        setNotification('address-not-found')
      } else {
        handlePasswordDialogDismiss()
        showErrorMessage('Error', 'Fail to sign the message')
      }
      return res
    },
    [setSignature, handlePasswordDialogDismiss, address, wallet, message]
  )

  const addressError = useMemo(() => {
    if (!address) {
      return undefined
    }
    try {
      validateAddress(address, isMainnet)
    } catch (err) {
      if (isErrorWithI18n(err)) {
        return t(err.message, err.i18n)
      }
    }
    if (wallet?.addresses && !wallet.addresses.find(item => item.address === address)) {
      return t('sign-and-verify.address-not-found')
    }
    return undefined
  }, [t, address, isMainnet, wallet.addresses])

  const assets = [
    { symbol: 'CKB', amount: '10' },
    { symbol: 'USDI', amount: '1.0000001' },
  ]

  return (
    <Dialog
      show
      title={t('perun.close-channel')}
      disabled={!message || !signature || !address || !!addressError}
      onCancel={onClose}
      onConfirm={handleVerifyMessage}
      contentClassName={styles.contentClassName}
    >
      <div className={styles.container}>
        <Alert status="warn" className={styles.notification}>
          {t('perun.close-channel-notification')}
        </Alert>

        <div className={styles.mainContent}>
          <p className={styles.tips}>{t('perun.close-channel-tips')}</p>

          <p className={styles.title}>{t('perun.you-will-receive')}:</p>
          <div className={styles.assets}>
            {assets.map(item => (
              <div key={item.symbol} className={styles.assetItem}>
                <p>{item.amount}</p>
                <p>{item.symbol}</p>
              </div>
            ))}
          </div>
          <TextField
            rows={2}
            value="ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqtjqdaykwujpd0a3dv7p94zx4e7djpg07s588pj7"
            disabled
          />

          <p className={styles.title}>{t('perun.other-party-will-receive')}:</p>
          <div className={styles.assets}>
            {assets.map(item => (
              <div key={item.symbol} className={styles.assetItem}>
                <p>{item.amount}</p>
                <p>{item.symbol}</p>
              </div>
            ))}
          </div>
          <TextField
            rows={2}
            value="ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqtjqdaykwujpd0a3dv7p94zx4e7djpg07s588pj7"
            disabled
          />

          <p className={styles.title}>{t('perun.transaction-fee')}: 2 CKB</p>
        </div>
      </div>
    </Dialog>
  )
}

PerunCloseChannel.displayName = 'PerunCloseChannel'

export default PerunCloseChannel
