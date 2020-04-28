import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { showErrorMessage, signMessage, verifyMessage, getAddressesByWalletID } from 'services/remote'
import Button from 'widgets/Button'
import DownArrow from 'widgets/Icons/DownArrow.png'
import { useExitOnWalletChange } from 'utils/hooks'
import { shannonToCKBFormatter } from 'utils/formatters'
import Balance from 'widgets/Balance'
import TextField from 'widgets/TextField'
import VerificationSuccessIcon from 'widgets/Icons/VerificationSuccess.png'
import VerificationFailureIcon from 'widgets/Icons/VerificationFailure.png'
import Spinner from 'widgets/Spinner'

import { ErrorCode } from 'utils/const'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import styles from './signAndVerify.module.scss'

const PasswordRequest = ({
  onCancel,
  onSubmit,
  error,
}: {
  onCancel: React.MouseEventHandler
  onSubmit: (pwd: string) => Promise<void>
  error: string
}) => {
  const [t] = useTranslation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = useCallback(
    e => {
      setPassword(e.target.value)
    },
    [setPassword]
  )

  const disabled = !password || loading

  const onConfirm = useCallback(
    (e: React.FormEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (disabled) {
        return
      }
      setLoading(true)
      onSubmit(password).finally(() => {
        setLoading(false)
      })
    },
    [setLoading, onSubmit, password, disabled]
  )
  return (
    <div className={styles.passwordDialog}>
      <form onSubmit={onConfirm}>
        <h2>{t('sign-and-verify.sign')}</h2>
        <TextField
          type="password"
          field={password}
          value={password}
          onChange={onChange}
          required
          label={t('sign-and-verify.password')}
          error={error}
          autoFocus
        />
        <div className={styles.actions}>
          <Button type="cancel" label={t('sign-and-verify.cancel')} onClick={onCancel} />
          <Button type="submit" label={t('sign-and-verify.confirm')} disabled={disabled} onClick={onConfirm}>
            {loading ? <Spinner /> : `${t('sign-and-verify.confirm')}`}
          </Button>
        </div>
      </form>
    </div>
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
      <span>{t('sign-and-verify.address-not-found')}</span>
      <Button label="OK" type="primary" onClick={onDismiss} />
    </div>
  )
}

const SignAndVerify = () => {
  const [t] = useTranslation()
  const [status, setStatus] = useState<
    'edit' | 'request-password' | 'verify-success' | 'verify-failure' | 'address-not-found'
  >('edit')
  const [wallet, setWallet] = useState<Pick<State.Wallet, 'id' | 'addresses'> | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [address, setAddress] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  useEffect(() => {
    const id = window.location.href.split('/').pop()
    getAddressesByWalletID(id || '').then(res => {
      if (res.status === 1) {
        setWallet({
          id: id!,
          addresses: res.result,
        })
      } else {
        showErrorMessage('Error', 'Wallet is not found')
      }
    })
  }, [])

  useExitOnWalletChange()

  const onInputChange = useCallback(
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

  const onAddrSelected = useCallback(
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

  const onRequestPassword = useCallback(() => {
    setStatus('request-password')
  }, [setStatus])

  const onVerifyMessage = useCallback(() => {
    verifyMessage({ message, signature, address })
      .then((res: ControllerResponse) => {
        if (res.status === 1) {
          setStatus('verify-success')
        } else {
          setStatus('verify-failure')
        }
      })
      .catch((err: Error) => {
        showErrorMessage('Error', err.message)
      })
  }, [message, address, setStatus, signature])

  const onCancel = useCallback(() => {
    window.close()
  }, [])

  const onDialogDismiss = useCallback(() => {
    setStatus('edit')
    setPwdErr('')
  }, [setStatus, setPwdErr])

  const onSignMessage = useCallback(
    async (password: string) => {
      const res: ControllerResponse = await signMessage({
        walletID: wallet?.id ?? '',
        address,
        message,
        password,
      })
      if (res.status === 1) {
        setSignature(res.result)
        setStatus('edit')
      } else if (res.status === ErrorCode.PasswordIncorrect) {
        setPwdErr((res.message as { content: string }).content)
      } else if (res.status === ErrorCode.AddressNotFound) {
        setStatus('address-not-found')
      } else {
        setStatus('edit')
        showErrorMessage('Error', 'Fail to sign the message')
      }
    },
    [setSignature, setStatus, setPwdErr, address, wallet, message]
  )

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('sign-and-verify.sign-or-verify-message')}</h1>
      <h2 className={styles.label}>{t('sign-and-verify.message')}</h2>
      <textarea data-field="message" value={message} onChange={onInputChange} />
      <div className={styles.address}>
        <h2 className={styles.label}>{t('sign-and-verify.address')}</h2>
        <input className={styles.addrInput} data-field="address" value={address} onChange={onInputChange} />
        <div className={styles.dropdownBtn}>
          <img src={DownArrow} alt="more" />
        </div>
        {wallet && wallet.addresses ? (
          <div role="presentation" className={styles.addrList} onClick={onAddrSelected}>
            {wallet.addresses.map(addr => (
              <div key={addr.address} className={styles.addrOpt} data-addr={addr.address}>
                <span>{addr.address}</span>
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
      <textarea data-field="signature" value={signature} onChange={onInputChange} />
      <div className={styles.actions}>
        <Button type="cancel" label={t('sign-and-verify.cancel')} onClick={onCancel} />
        <Button
          type="primary"
          label={t('sign-and-verify.sign')}
          disabled={!message || !address}
          onClick={onRequestPassword}
        />
        <Button
          type="primary"
          label={t('sign-and-verify.verify')}
          disabled={!message || !signature || !address}
          onClick={onVerifyMessage}
        />
      </div>

      {status !== 'edit' ? (
        <div className={styles.dialogContainer} role="presentation" onClick={onDialogDismiss}>
          <div
            role="presentation"
            className={styles.dialog}
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            {status === 'request-password' ? (
              <PasswordRequest onCancel={onDialogDismiss} onSubmit={onSignMessage} error={pwdErr} />
            ) : null}
            {status === 'verify-failure' ? <VerifyFailure /> : null}
            {status === 'verify-success' ? <VerifySuccess /> : null}
            {status === 'address-not-found' ? <AddressNotFound onDismiss={onDialogDismiss} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

SignAndVerify.displayName = 'SignAndVerify'

export default SignAndVerify
