import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import HardwareSign from 'components/HardwareSign'
import { ErrorCode, RoutePath, isSuccessResponse, errorFormatter } from 'utils'

import {
  useState as useGlobalState,
  useDispatch,
  AppActions,
  sendTransaction,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
} from 'states'
import { OfflineSignJSON, signAndExportTransaction, OfflineSignType } from 'services/remote'
import { PasswordIncorrectException } from 'exceptions'
import styles from '../PasswordRequest/passwordRequest.module.scss'

interface SignDialogProps {
  isBroadcast: boolean
  wallet: State.Wallet
  offlineSignJSON: OfflineSignJSON
  onDismiss: () => void
}

const OfflineSignDialog = ({ isBroadcast, wallet, offlineSignJSON, onDismiss }: SignDialogProps) => {
  const {
    app: {
      send: { description },
    },
    experimental,
  } = useGlobalState()

  const walletID = wallet.id
  const { transaction, type: signType, asset_account: assetAccount } = offlineSignJSON

  const dispatch = useDispatch()
  const [t] = useTranslation()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSigning, setIsSigning] = useState(false)

  useEffect(() => {
    setPassword('')
    setError('')
  }, [signType, setError, setPassword])

  const disabled = !password || isSigning

  const signAndExport = useCallback(async () => {
    const res = await signAndExportTransaction({
      ...offlineSignJSON,
      walletID,
      password,
    })
    if (!isSuccessResponse(res)) {
      setError(errorFormatter(res.message, t))
      return
    }
    dispatch({
      type: AppActions.UpdateLoadedTransaction,
      payload: res.result!,
    })
    onDismiss()
  }, [offlineSignJSON, dispatch, onDismiss, t, password, walletID])

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (disabled) {
        return
      }
      setIsSigning(true)
      if (!isBroadcast) {
        await signAndExport()
        setIsSigning(false)
        return
      }
      try {
        switch (signType) {
          case OfflineSignType.Regular: {
            if (isSigning) {
              break
            }
            await sendTransaction({ walletID, tx: transaction, description, password })(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                navigate(RoutePath.History)
              } else if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case OfflineSignType.UnlockDAO: {
            if (isSigning) {
              break
            }
            await sendTransaction({ walletID, tx: transaction, description, password })(dispatch).then(({ status }) => {
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
          case OfflineSignType.CreateSUDTAccount: {
            const params: Controller.SendCreateSUDTAccountTransaction.Params = {
              walletID,
              assetAccount: assetAccount ?? experimental?.assetAccount,
              tx: transaction,
              password,
            }
            await sendCreateSUDTAccountTransaction(params)(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                navigate(RoutePath.History)
              } else if (status === ErrorCode.PasswordIncorrect) {
                throw new PasswordIncorrectException()
              }
            })
            break
          }
          case OfflineSignType.SendSUDT: {
            const params: Controller.SendSUDTTransaction.Params = {
              walletID,
              tx: transaction,
              password,
            }
            await sendSUDTTransaction(params)(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                navigate(RoutePath.History)
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
        if (err instanceof PasswordIncorrectException) {
          setError(t(err.message))
        }
      }
    },
    [
      dispatch,
      walletID,
      password,
      signType,
      description,
      navigate,
      isSigning,
      transaction,
      disabled,
      experimental,
      setError,
      t,
      isBroadcast,
      signAndExport,
      assetAccount,
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

  const title = useMemo(() => {
    return !isBroadcast ? t('offline-sign.sign-and-export') : t('offline-sign.sign-and-broadcast')
  }, [isBroadcast, t])

  if (wallet.device) {
    return (
      <HardwareSign
        signType="transaction"
        navigate={navigate}
        wallet={wallet}
        onDismiss={onDismiss}
        offlineSignJSON={offlineSignJSON}
      />
    )
  }

  return (
    <Dialog show title={title} onCancel={onDismiss} onConfirm={onSubmit} disabled={disabled} isLoading={isSigning}>
      <TextField
        label={t('password-request.password')}
        value={password}
        field="password"
        type="password"
        title={t('password-request.password')}
        onChange={onChange}
        autoFocus
        className={styles.passwordInput}
        error={error}
      />
    </Dialog>
  )
}

OfflineSignDialog.displayName = 'SoftWalletOfflineSign'

export default OfflineSignDialog
