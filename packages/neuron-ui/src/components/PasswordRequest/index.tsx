import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import HardwareSign from 'components/HardwareSign'
import { useDialog, ErrorCode, RoutePath, isSuccessResponse, errorFormatter } from 'utils'

import {
  useState as useGlobalState,
  useDispatch,
  AppActions,
  sendTransaction,
  deleteWallet,
  backupWallet,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
} from 'states'
import { exportTransactionAsJSON, OfflineSignStatus, OfflineSignType, signAndExportTransaction } from 'services/remote'
import { PasswordIncorrectException } from 'exceptions'
import DropdownButton from 'widgets/DropdownButton'
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
  }, [actionType, setError, setPassword])

  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
    })
  }, [dispatch])

  const signType = useMemo(() => {
    switch (actionType) {
      case 'create-sudt-account':
        return OfflineSignType.CreateSUDTAccount
      case 'send-acp':
      case 'send-sudt':
        return OfflineSignType.SendSUDT
      case 'unlock':
        return OfflineSignType.UnlockDAO
      default:
        return OfflineSignType.Regular
    }
  }, [actionType])

  const exportTransaction = useCallback(async () => {
    onDismiss()
    await exportTransactionAsJSON({
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Unsigned,
      type: signType,
      description,
      asset_account: experimental?.assetAccount,
    })
  }, [signType, generatedTx, onDismiss, description, experimental])

  useDialog({ show: actionType, dialogRef, onClose: onDismiss })

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])

  const isLoading =
    ['send', 'unlock', 'create-sudt-account', 'send-sudt', 'send-acp'].includes(actionType || '') && isSending
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
            await sendTransaction({ walletID, tx: generatedTx, description, password })(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
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
            await sendTransaction({ walletID, tx: generatedTx, description, password })(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
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
          case 'create-sudt-account': {
            const params: Controller.SendCreateSUDTAccountTransaction.Params = {
              walletID,
              assetAccount: experimental?.assetAccount,
              tx: experimental?.tx,
              password,
            }
            await sendCreateSUDTAccountTransaction(params)(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                history.push(RoutePath.History)
              } else if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case 'send-acp':
          case 'send-sudt': {
            const params: Controller.SendSUDTTransaction.Params = {
              walletID,
              tx: experimental?.tx,
              password,
            }
            await sendSUDTTransaction(params)(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                history.push(RoutePath.History)
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

  const signAndExportFromGenerateTx = useCallback(async () => {
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: {
        sending: true,
      },
    })
    const json = {
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Signed,
      type: signType,
      description,
      asset_account: experimental?.assetAccount,
    }
    const res = await signAndExportTransaction({
      ...json,
      walletID,
      password,
    })
    if (!isSuccessResponse(res)) {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: { sending: false },
      })
      setError(errorFormatter(res.message, t))
      return
    }
    dispatch({
      type: AppActions.UpdateLoadedTransaction,
      payload: {
        json: res.result!,
      },
    })
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
    onDismiss()
  }, [description, dispatch, experimental, generatedTx, onDismiss, password, signType, t, walletID])

  const dropdownList = [
    {
      text: t('offline-sign.sign-and-export'),
      onClick: signAndExportFromGenerateTx,
    },
  ]

  if (!wallet) {
    return null
  }

  if (wallet.device) {
    return (
      <HardwareSign
        signType="transaction"
        history={history}
        wallet={wallet}
        onDismiss={onDismiss}
        offlineSignType={signType}
      />
    )
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form onSubmit={onSubmit}>
        <h2 className={styles.title}>{t(`password-request.${actionType}.title`)}</h2>
        {['unlock', 'create-sudt-account', 'send-sudt', 'send-acp'].includes(actionType ?? '') ? null : (
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
          <div className={styles.left}>
            <DropdownButton
              mainBtnLabel={t('offline-sign.export')}
              mainBtnOnClick={exportTransaction}
              mainBtnDisabled={isLoading}
              list={dropdownList}
            />
          </div>
          <div className={styles.right}>
            <Button label={t('common.cancel')} type="cancel" onClick={onDismiss} />
            <Button label={t('common.confirm')} type="submit" disabled={disabled}>
              {isLoading ? <Spinner /> : (t('common.confirm') as string)}
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
