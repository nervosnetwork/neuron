import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import Dialog from 'widgets/Dialog'
import TextField from 'widgets/TextField'
import Alert from 'widgets/Alert'
import { errorFormatter, useCopy, isSuccessResponse } from 'utils'
import { Attention, Copy } from 'widgets/Icons/icon'
import { getPrivateKeyByAddress } from 'services/remote'
import styles from './viewPrivateKey.module.scss'

const ViewPrivateKey = ({ onClose, address }: { onClose?: () => void; address?: string }) => {
  const [t] = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { copied, onCopy, copyTimes } = useCopy()
  const {
    wallet: { id: walletID = '' },
  } = useGlobalState()

  useEffect(() => {
    setPassword('')
    setError('')
  }, [setError, setPassword])

  const onChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setPassword(value)
      setError('')
    },
    [setPassword, setError]
  )

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (!password) {
        return
      }
      setIsLoading(true)
      try {
        const res = await getPrivateKeyByAddress({
          walletID,
          address,
          password,
        })

        setIsLoading(false)

        if (!isSuccessResponse(res)) {
          setError(errorFormatter(res.message, t))
          return
        }
        setPrivateKey(res.result)
      } catch (err) {
        setIsLoading(false)
      }
    },
    [walletID, password, setError, t]
  )

  if (privateKey) {
    return (
      <Dialog
        show
        title={t('addresses.view-private-key')}
        onConfirm={onClose}
        onCancel={onClose}
        showCancel={false}
        confirmText={t('common.close')}
        className={styles.dialog}
      >
        <div>
          <div className={styles.tip}>
            <Attention />
            {t('addresses.view-private-key-tip')}
          </div>

          <TextField
            className={styles.passwordInput}
            placeholder={t('password-request.placeholder')}
            width="100%"
            label={<span className={styles.label}>{t('addresses.private-key')}</span>}
            value={privateKey}
            field="password"
            type="password"
            disabled
            suffix={
              <div className={styles.copy}>
                <Copy onClick={() => onCopy(privateKey)} />
              </div>
            }
          />

          {copied ? (
            <Alert status="success" className={styles.notice} key={copyTimes.toString()}>
              {t('common.copied')}
            </Alert>
          ) : null}
        </div>
      </Dialog>
    )
  }
  return (
    <Dialog
      show
      title={t('addresses.view-private-key')}
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmText={t('wizard.next')}
      isLoading={isLoading}
      disabled={!password || isLoading}
      className={styles.dialog}
    >
      <div>
        <div className={styles.tip}>
          <Attention />
          {t('addresses.view-private-key-tip')}
        </div>

        <TextField
          className={styles.passwordInput}
          placeholder={t('password-request.placeholder')}
          width="100%"
          label={t('wizard.password')}
          value={password}
          field="password"
          type="password"
          onChange={onChange}
          autoFocus
          error={error}
        />
      </div>
    </Dialog>
  )
}

ViewPrivateKey.displayName = 'ViewPrivateKey'

export default ViewPrivateKey
