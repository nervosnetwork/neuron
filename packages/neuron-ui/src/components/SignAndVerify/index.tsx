import React, { useState, useEffect, useCallback } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { showErrorMessage, signMessage, verifyMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { ErrorCode, isSuccessResponse, shannonToCKBFormatter, useExitOnWalletChange, useOnLocaleChange } from 'utils'
import { useState as useGlobalState } from 'states'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import TextField from 'widgets/TextField'
import { ReactComponent as VerificationFailureIcon } from 'widgets/Icons/VerificationFailure.svg'
import { InfoCircleOutlined } from 'widgets/Icons/icon'
import Dialog from 'widgets/Dialog'
import Tooltip from 'widgets/Tooltip'
import { ReactComponent as Arrow } from 'widgets/Icons/Arrow.svg'
import { ReactComponent as Sign } from 'widgets/Icons/Sign.svg'
import { ReactComponent as SuccessCircle } from 'widgets/Icons/SuccessCircle.svg'
import HardwareSign from 'components/HardwareSign'
import styles from './signAndVerify.module.scss'

interface PasswordDialogProps {
  show: boolean
  walletName: string
  onCancel: () => void
  onSubmit: (pwd: string) => Promise<ControllerResponse>
}

const PasswordDialog = ({ show, walletName, onCancel, onSubmit }: PasswordDialogProps) => {
  const [t, i18n] = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const disabled = !password || loading

  useOnLocaleChange(i18n)

  useEffect(() => {
    if (!show) {
      setPassword('')
      setError('')
    }
  }, [show, setPassword, setError])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPassword(e.target.value)
    },
    [setPassword]
  )

  const handleConfirm = useCallback(() => {
    if (disabled) {
      return
    }
    setLoading(true)
    onSubmit(password)
      .then(res => {
        if (res.status === ErrorCode.PasswordIncorrect) {
          setError((res.message as { content: string }).content)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [setLoading, onSubmit, password, disabled])

  return (
    <Dialog
      show={show}
      title={t('sign-and-verify.sign')}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      disabled={disabled}
      isLoading={loading}
    >
      <div className={styles.passwordDialog}>
        <p className={styles.walletName}>{walletName}</p>
        <TextField
          type="password"
          field="password"
          value={password}
          onChange={handleInputChange}
          label={t('sign-and-verify.password')}
          error={error}
          autoFocus
        />
      </div>
    </Dialog>
  )
}

type Notification = 'verify-success' | 'verify-old-sign-success' | 'verify-failure' | 'address-not-found' | null

interface NotificationsProps {
  notification: Notification
  failReason?: string
  onDismiss: () => void
  t: TFunction
}

const Notifications = ({ notification, onDismiss, t, failReason }: NotificationsProps) =>
  notification ? (
    <div className={styles.dialogContainer} role="presentation">
      <div
        role="presentation"
        className={styles.dialog}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        <div className={styles.resultDialog}>
          <VerificationFailureIcon />
          <span>{t('sign-and-verify.verification-failure')}</span>
          <span className={styles.failReason}>
            {notification === 'address-not-found' ? t('sign-and-verify.address-not-found') : failReason}
          </span>
          <Button label={t('common.back')} type="primary" onClick={onDismiss} />
        </div>
      </div>
    </div>
  ) : null

const VerifySuccess = ({ onDismiss, t }: { onDismiss: () => void; t: TFunction }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 3000)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className={styles.successNotification}>
      <div className={styles.content}>
        <SuccessCircle />
        {t('sign-and-verify.verification-success')}
      </div>
    </div>
  )
}

const SignAndVerify = () => {
  const [t, i18n] = useTranslation()
  const [notification, setNotification] = useState<Notification>(null)
  const [failReason, setFailReason] = useState<string | undefined>('')
  const [showDialog, setShowDialog] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [address, setAddress] = useState('')
  const { wallet } = useGlobalState()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  useOnLocaleChange(i18n)
  useExitOnWalletChange()
  useEffect(() => {
    window.document.title = i18n.t(`sign-and-verify.window-title`)
    // eslint-disable-next-line
  }, [i18n.language])

  useEffect(() => {
    const id = window.location.href.split('id=').pop()
    if (!id) {
      showErrorMessage(t('messages.error'), t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'wallet' }))
      window.close()
    }
  }, [t])

  const handlePasswordDialogOpen = useCallback(() => {
    setShowDialog(false)
    setIsDialogOpen(true)
  }, [setIsDialogOpen])

  const handlePasswordDialogDismiss = useCallback(() => {
    setShowDialog(true)
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  const handleNotificationDismiss = useCallback(() => {
    setShowDialog(true)
    setNotification(null)
    setFailReason('')
  }, [setNotification])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
      const {
        dataset: { field },
        value,
      } = e.target
      switch (field) {
        case 'message': {
          setMessage(value)
          break
        }
        case 'signature': {
          setSignature(value)
          break
        }
        case 'address': {
          setAddress(value)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [setMessage, setSignature, setAddress]
  )

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

  const navigate = useNavigate()
  const onBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return (
    <div>
      <Dialog
        show={showDialog}
        title={t('sign-and-verify.sign-or-verify-message')}
        disabled={!message || !signature || !address}
        onCancel={onBack}
        confirmText={t('sign-and-verify.verify')}
        onConfirm={handleVerifyMessage}
      >
        <div>
          <TextField
            label={t('sign-and-verify.message')}
            data-field="message"
            value={message}
            onChange={handleInputChange}
            width="100%"
            rows={3}
          />
          <div className={styles.tips}>
            <span>{t('sign-and-verify.sign-with-magic-byte')}</span>
            <Tooltip tip={t('sign-and-verify.verify-tip')}>
              <InfoCircleOutlined />
            </Tooltip>
          </div>

          <div className={styles.selectAddress}>
            <div className={styles.dropdown}>
              <div className={styles.content}>
                <TextField
                  label={t('sign-and-verify.address')}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  data-field="address"
                  value={address}
                  onChange={handleInputChange}
                  rows={2}
                  suffix={
                    <div className={styles.arrow} data-active={isDropdownOpen}>
                      <Arrow />
                    </div>
                  }
                  width="100%"
                />
              </div>
              {isDropdownOpen && wallet?.addresses ? (
                <div className={styles.selects}>
                  {wallet.addresses.map(addr => (
                    <Button
                      type="text"
                      key={addr.address}
                      className={styles.selectItem}
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setAddress(addr.address)
                      }}
                    >
                      <div className={styles.wrap}>
                        <div className={styles.title}>
                          {`${addr.address.slice(0, 16)}...${addr.address.slice(-16)} `}
                          (<Balance balance={shannonToCKBFormatter(addr.balance)} />)
                        </div>
                        <div className={styles.type} data-type={addr.type}>
                          {addr.type === 1 ? t('addresses.change-address') : t('addresses.receiving-address')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <TextField
            label={t('sign-and-verify.signature')}
            field="signature"
            value={signature}
            onChange={handleInputChange}
            disabled={!signature}
            width="100%"
          />

          {wallet?.isWatchOnly || (
            <div className={styles.signWrap}>
              <Button type="text" disabled={!message || !address} onClick={handlePasswordDialogOpen}>
                <Sign />
                {t('sign-and-verify.sign')}
              </Button>
            </div>
          )}

          {notification === 'verify-success' || notification === 'verify-old-sign-success' ? (
            <VerifySuccess onDismiss={handleNotificationDismiss} t={t} />
          ) : null}
        </div>
      </Dialog>

      {notification && (
        <Notifications
          notification={notification}
          failReason={failReason}
          onDismiss={handleNotificationDismiss}
          t={t}
        />
      )}

      {isDialogOpen && wallet?.device ? (
        <HardwareSign
          signType="message"
          signMessage={handleSignMessage}
          wallet={wallet}
          onDismiss={handlePasswordDialogDismiss}
        />
      ) : (
        <PasswordDialog
          show={isDialogOpen}
          walletName={wallet?.name}
          onCancel={handlePasswordDialogDismiss}
          onSubmit={handleSignMessage}
        />
      )}
    </div>
  )
}

SignAndVerify.displayName = 'SignAndVerify'

export default SignAndVerify
