import React, { useState, useEffect, useCallback, useRef } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { showErrorMessage, signMessage, verifyMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  ErrorCode,
  isSuccessResponse,
  shannonToCKBFormatter,
  useDialog,
  useExitOnWalletChange,
  useOnLocaleChange,
} from 'utils'
import { useState as useGlobalState } from 'states'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import DownArrow from 'widgets/Icons/DownArrow.png'
import VerificationSuccessIcon from 'widgets/Icons/VerificationSuccess.png'
import VerificationFailureIcon from 'widgets/Icons/VerificationFailure.png'
import VerificationWarningIcon from 'widgets/Icons/Warning.png'
import { InfoCircleOutlined } from 'widgets/Icons/icon'

import HardwareSign from 'components/HardwareSign'
import styles from './signAndVerify.module.scss'

interface PasswordDialogProps {
  dialogRef: React.MutableRefObject<HTMLDialogElement | null>
  onCancel: React.MouseEventHandler
  onSubmit: (pwd: string) => Promise<ControllerResponse>
}

const PasswordDialog = ({ dialogRef, onCancel, onSubmit }: PasswordDialogProps) => {
  const [t, i18n] = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const disabled = !password || loading

  useOnLocaleChange(i18n)

  useEffect(() => {
    if (!dialogRef.current?.open) {
      setPassword('')
      setError('')
    }
    // eslint-disable-next-line
  }, [dialogRef.current && dialogRef.current.open, setPassword, setError])

  const handleInputChange = useCallback(
    e => {
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
    <dialog ref={dialogRef} className={styles.passwordDialog}>
      <form onSubmit={handleConfirm}>
        <h2>{t('sign-and-verify.sign')}</h2>
        <TextField
          type="password"
          field="password"
          value={password}
          onChange={handleInputChange}
          required
          label={t('sign-and-verify.password')}
          error={error}
          autoFocus
        />
        <div className={styles.actions}>
          <Button type="cancel" label={t('sign-and-verify.cancel')} onClick={onCancel} />
          <Button type="submit" label={t('sign-and-verify.confirm')} disabled={disabled} onClick={handleConfirm}>
            {loading ? <Spinner /> : `${t('sign-and-verify.confirm')}`}
          </Button>
        </div>
      </form>
    </dialog>
  )
}

const VerifyFailure = () => {
  const [t] = useTranslation()
  return (
    <div className={styles.resultDialog}>
      <img src={VerificationFailureIcon} alt="failure" />
      <span>{t('sign-and-verify.verification-failure')}</span>
    </div>
  )
}

const VerifySuccess = () => {
  const [t] = useTranslation()
  return (
    <div className={styles.resultDialog}>
      <img src={VerificationSuccessIcon} alt="success" />
      <span>{t('sign-and-verify.verification-success')}</span>
    </div>
  )
}

const AddressNotFound = ({ onDismiss }: { onDismiss: () => void }) => {
  const [t] = useTranslation()
  return (
    <div className={styles.addressNotFound}>
      <img src={VerificationWarningIcon} alt="warning" />
      <span>{t('sign-and-verify.address-not-found')}</span>
      <Button label="OK" type="primary" onClick={onDismiss} />
    </div>
  )
}

type Notification = 'verify-success' | 'verify-old-sign-success' | 'verify-failure' | 'address-not-found' | null

interface NotificationsProps {
  notification: Notification
  onDismiss: () => void
  t: TFunction
}

const Notifications = ({ notification, onDismiss, t }: NotificationsProps) =>
  notification !== null ? (
    <div className={styles.dialogContainer} role="presentation" onClick={onDismiss}>
      <div
        role="presentation"
        className={styles.dialog}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
      >
        {notification === 'verify-failure' ? <VerifyFailure /> : null}
        {notification === 'verify-success' ? <VerifySuccess /> : null}
        {notification === 'verify-old-sign-success' ? (
          <>
            <VerifySuccess />
            {t('sign-and-verify.verify-old-sign-success')}
          </>
        ) : null}
        {notification === 'address-not-found' ? <AddressNotFound onDismiss={onDismiss} /> : null}
      </div>
    </div>
  ) : null

const SignAndVerify = () => {
  const [t, i18n] = useTranslation()
  const [notification, setNotification] = useState<Notification>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [address, setAddress] = useState('')
  const { wallet } = useGlobalState()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useOnLocaleChange(i18n)
  useExitOnWalletChange()
  useEffect(() => {
    window.document.title = i18n.t(`sign-and-verify.window-title`)
    // eslint-disable-next-line
  }, [i18n.language])

  useEffect(() => {
    const id = window.location.href.split('/').pop()
    if (!id) {
      showErrorMessage(t('messages.error'), t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'wallet' }))
      window.close()
    }
  }, [t])

  const handlePasswordDialogOpen = useCallback(() => {
    setIsDialogOpen(true)
  }, [setIsDialogOpen])

  const handlePasswordDialogDismiss = useCallback(() => {
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  const handleNotificationDismiss = useCallback(() => {
    setNotification(null)
  }, [setNotification])

  useDialog({
    show: isDialogOpen,
    dialogRef,
    onClose: handlePasswordDialogDismiss,
  })

  const handleInputChange = useCallback(
    e => {
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

  const handleAddrSelected = useCallback(
    e => {
      const {
        dataset: { addr },
      } = e.target
      if (addr) {
        setAddress(addr)
      }
    },
    [setAddress]
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
        }
      })
      .catch((err: Error) => {
        showErrorMessage('Error', err.message)
      })
  }, [message, address, setNotification, signature])

  const handleClose = useCallback(() => {
    window.close()
  }, [])

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('sign-and-verify.sign-or-verify-message')}</h1>

      <h2 className={styles.label}>{t('sign-and-verify.message')}</h2>
      <textarea data-field="message" value={message} onChange={handleInputChange} />
      <div className={styles.tips}>
        {t('sign-and-verify.sign-with-magic-byte')}
        <span className={styles.infoIconContainer} data-tip={t('sign-and-verify.verify-tip')}>
          <InfoCircleOutlined />
        </span>
      </div>

      <div className={styles.address}>
        <h2 className={styles.label}>{t('sign-and-verify.address')}</h2>
        <input className={styles.addrInput} data-field="address" value={address} onChange={handleInputChange} />
        <div className={styles.dropdownBtn}>
          <img src={DownArrow} alt="more" />
        </div>
        {wallet && wallet.addresses ? (
          <div role="presentation" className={styles.addrList} onClick={handleAddrSelected}>
            {wallet.addresses.map(addr => (
              <div key={addr.address} className={styles.addrOpt} data-addr={addr.address}>
                <span>{`${addr.address.slice(0, 30)}...${addr.address.slice(-30)}`}</span>
                <Balance balance={shannonToCKBFormatter(addr.balance)} />
                <span className={styles.addrType} data-type={addr.type}>
                  {addr.type === 0 ? t('addresses.receiving-address') : t('addresses.change-address')}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <h2 className={styles.label}>{t('sign-and-verify.signature')}</h2>
      <TextField field="signature" value={signature} onChange={handleInputChange} className={styles.signatureField} />

      <div className={styles.actions}>
        <Button type="cancel" label={t('sign-and-verify.cancel')} onClick={handleClose} />
        {wallet?.isWatchOnly || (
          <Button
            type="primary"
            label={t('sign-and-verify.sign')}
            disabled={!message || !address}
            onClick={handlePasswordDialogOpen}
          />
        )}
        <Button
          type="primary"
          label={t('sign-and-verify.verify')}
          disabled={!message || !signature || !address}
          onClick={handleVerifyMessage}
        />
      </div>

      <Notifications notification={notification} onDismiss={handleNotificationDismiss} t={t} />
      {isDialogOpen && wallet?.device ? (
        <HardwareSign
          signType="message"
          signMessage={handleSignMessage}
          wallet={wallet}
          onDismiss={handlePasswordDialogDismiss}
        />
      ) : (
        <PasswordDialog dialogRef={dialogRef} onCancel={handlePasswordDialogDismiss} onSubmit={handleSignMessage} />
      )}
    </div>
  )
}

SignAndVerify.displayName = 'SignAndVerify'

export default SignAndVerify
