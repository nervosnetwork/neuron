import React, { useRef, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import { useDialog } from 'utils/hooks'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { AppActions } from 'states/stateProvider/reducer'
import { sendTransaction, deleteWallet, backupWallet } from 'states/stateProvider/actionCreators'
import styles from './passwordRequest.module.scss'

const PasswordRequest = () => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null, password = '' },
    },
    settings: { wallets = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
  }, [dispatch])
  useDialog({ show: actionType, dialogRef, onClose: onDismiss })

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])

  const onConfirm = useCallback(() => {
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
        })(dispatch, history)
        break
      }
      case 'delete': {
        deleteWallet({
          id: walletID,
          password,
        })(dispatch)
        break
      }
      case 'backup': {
        backupWallet({
          id: walletID,
          password,
        })(dispatch)
        break
      }
      default: {
        break
      }
    }
  }, [dispatch, walletID, password, actionType, description, history, isSending, generatedTx])

  const onChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      if (/\s/.test(value)) {
        return
      }
      dispatch({
        type: AppActions.UpdatePassword,
        payload: value,
      })
    },
    [dispatch]
  )
  const disabled = !password || (actionType === 'send' && isSending)
  const onKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !disabled) {
        onConfirm()
      }
    },
    [onConfirm, disabled]
  )
  if (!wallet) {
    return null
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <h2 className={styles.title}>{t(`password-request.${actionType}.title`)}</h2>
      <div className={styles.walletName}>{wallet ? wallet.name : null}</div>
      <TextField
        label={t('password-request.password')}
        value={password}
        field="password"
        type="password"
        title={t('password-request.password')}
        onChange={onChange}
        autoFocus
        onKeyPress={onKeyPress}
        required
      />
      <div className={styles.footer}>
        <Button label={t('common.cancel')} type="cancel" onClick={onDismiss} />
        <Button label={t('common.confirm')} type="submit" onClick={onConfirm} disabled={disabled} />
      </div>
    </dialog>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
