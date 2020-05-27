import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import { useDialog, ResponseCode, ErrorCode, RoutePath } from 'utils'

import {
  useState as useGlobalState,
  useDispatch,
  AppActions,
  sendTransaction,
  deleteWallet,
  backupWallet,
} from 'states'
import { PasswordIncorrectException } from 'exceptions'
import styles from './passwordRequest.module.scss'

const PasswordRequest = () => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null },
    },
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setPassword('')
    setError('')
  }, [actionType, setError, setPassword])

  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
  }, [dispatch])
  useDialog({ show: actionType, dialogRef, onClose: onDismiss })

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])

  const isLoading = ['send', 'unlock'].includes(actionType || '') && isSending
  const disabled = !password || isSending

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (disabled) {
        return
      }
      try {
        switch (actionType) {
          case 'send': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: generatedTx, description, password })(dispatch).then(status => {
              if (status === ResponseCode.SUCCESS) {
                history.push(RoutePath.History)
              } else if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case 'delete': {
            await deleteWallet({ id: walletID, password })(dispatch).then(status => {
              if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case 'backup': {
            await backupWallet({ id: walletID, password })(dispatch).then(status => {
              if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case 'unlock': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: generatedTx, description, password })(dispatch).then(status => {
              if (status === ResponseCode.SUCCESS) {
                dispatch({
                  type: AppActions.SetGlobalDialog,
                  payload: 'unlock-success',
                })
              } else if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          default: {
            break
          }
        }
      } catch (err) {
        if (err.code === ErrorCode.PasswordIncorrect) {
          setError(t(err.message))
        }
      }
    },
    [dispatch, walletID, password, actionType, description, history, isSending, generatedTx, disabled, setError, t]
  )

  const onChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setPassword(value)
      setError('')
    },
    [setPassword, setError]
  )

  if (!wallet) {
    return null
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form onSubmit={onSubmit}>
        <h2 className={styles.title}>{t(`password-request.${actionType}.title`)}</h2>
        {actionType === 'unlock' ? null : <div className={styles.walletName}>{wallet ? wallet.name : null}</div>}
        <TextField
          label={t('password-request.password')}
          value={password}
          field="password"
          type="password"
          title={t('password-request.password')}
          onChange={onChange}
          autoFocus
          required
          className={styles.passwordInput}
          error={error}
        />
        <div className={styles.footer}>
          <Button label={t('common.cancel')} type="cancel" onClick={onDismiss} />
          <Button label={t('common.confirm')} type="submit" disabled={disabled}>
            {isLoading ? <Spinner /> : (t('common.confirm') as string)}
          </Button>
        </div>
      </form>
    </dialog>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
