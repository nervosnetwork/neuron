import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import { useDialog } from 'utils/hooks'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { AppActions } from 'states/stateProvider/reducer'
import {
  sendTransaction,
  deleteWallet,
  backupWallet,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
} from 'states/stateProvider/actionCreators'
import { ErrorCode } from 'utils/const'
import styles from './passwordRequest.module.scss'

const PasswordRequest = () => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null },
    },
    settings: { wallets = [] },
    experimental,
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
  }, [actionType, setError])

  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
  }, [dispatch])
  useDialog({ show: actionType, dialogRef, onClose: onDismiss })

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])

  const isLoading = ['send', 'unlock', 'create-sudt-account', 'send-sudt'].includes(actionType || '') && isSending
  const disabled = !password || isSending

  const onSubmit = useCallback(
    (e?: React.FormEvent): void => {
      if (e) {
        e.preventDefault()
      }
      if (disabled) {
        return
      }
      const setErrorIfPasswordIncorrect = (code: any) => {
        if (code === ErrorCode.PasswordIncorrect) {
          setError(t('messages.codes.103'))
        }
      }
      switch (actionType) {
        case 'send': {
          if (isSending) {
            break
          }
          sendTransaction({
            walletID,
            tx: generatedTx,
            description,
            password,
          })(dispatch, history).then(setErrorIfPasswordIncorrect)
          break
        }
        case 'delete': {
          deleteWallet({
            id: walletID,
            password,
          })(dispatch).then(setErrorIfPasswordIncorrect)
          break
        }
        case 'backup': {
          backupWallet({
            id: walletID,
            password,
          })(dispatch).then(setErrorIfPasswordIncorrect)
          break
        }
        case 'unlock': {
          if (isSending) {
            break
          }
          sendTransaction({
            walletID,
            tx: generatedTx,
            description,
            password,
          })(dispatch, history, { type: 'unlock' }).then(setErrorIfPasswordIncorrect)
          break
        }
        case 'create-sudt-account': {
          const params: Controller.SendCreateSUDTAccountTransaction.Params = {
            walletID,
            assetAccount: experimental?.assetAccount,
            tx: experimental?.tx,
            password,
          }
          sendCreateSUDTAccountTransaction(params)(dispatch, history).then(setErrorIfPasswordIncorrect)
          break
        }
        case 'send-sudt': {
          const params: Controller.SendSUDTTransaction.Params = {
            walletID,
            tx: experimental?.tx,
            password,
          }
          sendSUDTTransaction(params)(dispatch, history).then(setErrorIfPasswordIncorrect)
          break
        }
        default: {
          break
        }
      }
    },
    [
      dispatch,
      walletID,
      password,
      actionType,
      description,
      history,
      isSending,
      generatedTx,
      disabled,
      experimental,
      setError,
      t,
    ]
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
        {['unlock', 'create-sudt-account', 'send-sudt'].includes(actionType || '') ? null : (
          <div className={styles.walletName}>{wallet ? wallet.name : null}</div>
        )}
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
