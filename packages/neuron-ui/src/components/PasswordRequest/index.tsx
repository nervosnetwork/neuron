import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import TextField from 'widgets/TextField'
import Spinner from 'widgets/Spinner'
import HardwareSign from 'components/HardwareSign'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import { useDialog, ErrorCode, RoutePath, isSuccessResponse, errorFormatter } from 'utils'

import {
  useState as useGlobalState,
  useDispatch,
  AppActions,
  sendTransaction,
  deleteWallet,
  backupWallet,
  migrateAcp,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
} from 'states'
import {
  exportTransactionAsJSON,
  OfflineSignStatus,
  OfflineSignType,
  signAndExportTransaction,
  requestOpenInExplorer,
  invokeShowErrorMessage,
} from 'services/remote'
import { PasswordIncorrectException } from 'exceptions'
import DropdownButton from 'widgets/DropdownButton'
import styles from './passwordRequest.module.scss'

const PasswordRequest = () => {
  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { walletID = '', actionType = null, multisigConfig },
    },
    settings: { wallets = [] },
    experimental,
    wallet: currentWallet,
  } = useGlobalState()

  const dispatch = useDispatch()
  const [t] = useTranslation()
  const navigate = useNavigate()
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
      case 'send-ckb-asset':
      case 'send-acp-ckb-to-new-cell':
      case 'send-acp-sudt-to-new-cell':
      case 'send-sudt':
        return OfflineSignType.SendSUDT
      case 'unlock':
        return OfflineSignType.UnlockDAO
      case 'send-nft':
      case 'send-from-multisig-need-one':
      case 'send':
        return OfflineSignType.Regular
      case 'send-from-multisig':
        return OfflineSignType.SendFromMultisigOnlySig
      default:
        return OfflineSignType.Invalid
    }
  }, [actionType])

  const exportTransaction = useCallback(async () => {
    const res = await exportTransactionAsJSON({
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Unsigned,
      type: signType,
      description,
      asset_account: experimental?.assetAccount,
    })
    if (!isSuccessResponse(res)) {
      setError(errorFormatter(res.message, t))
      return
    }
    if (res.result) {
      onDismiss()
    }
  }, [signType, generatedTx, onDismiss, description, experimental])

  useDialog({ show: actionType, dialogRef, onClose: onDismiss })

  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])

  const isLoading =
    [
      'send',
      'unlock',
      'create-sudt-account',
      'send-sudt',
      'send-ckb-asset',
      'send-acp-ckb-to-new-cell',
      'send-acp-sudt-to-new-cell',
      'send-cheque',
      'withdraw-cheque',
      'claim-cheque',
      'create-account-to-claim-cheque',
      'send-from-multisig-need-one',
      'send-from-multisig',
      'destroy-asset-account',
    ].includes(actionType || '') && isSending
  const disabled = !password || isSending

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (disabled) {
        return
      }
      const handleSendTxRes = ({ status }: { status: number }) => {
        if (isSuccessResponse({ status })) {
          navigate(RoutePath.History)
        } else if (status === ErrorCode.PasswordIncorrect) {
          throw new PasswordIncorrectException()
        }
      }
      try {
        switch (actionType) {
          case 'send': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: generatedTx, description, password })(dispatch).then(handleSendTxRes)
            break
          }
          case 'send-from-multisig-need-one': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: generatedTx, description, password, multisigConfig })(dispatch).then(
              (res: { result: string; status: number; message: string | { content: string } }) => {
                if (isSuccessResponse(res)) {
                  requestOpenInExplorer({ type: 'transaction', key: res.result })
                } else if (res.status === ErrorCode.PasswordIncorrect) {
                  throw new PasswordIncorrectException()
                } else {
                  invokeShowErrorMessage({
                    title: t('messages.error'),
                    content: typeof res.message === 'string' ? res.message : res.message.content!,
                  })
                }
              }
            )
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
          case 'migrate-acp': {
            await migrateAcp({ id: walletID, password })(dispatch).then(({ status }) => {
              if (isSuccessResponse({ status })) {
                navigate(RoutePath.History)
              } else if (status === ErrorCode.PasswordIncorrect) {
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
            await sendCreateSUDTAccountTransaction(params)(dispatch).then(handleSendTxRes)
            break
          }
          case 'send-ckb-asset':
          case 'send-acp-ckb-to-new-cell':
          case 'send-acp-sudt-to-new-cell':
          case 'send-sudt': {
            let skipLastInputs = true
            if (actionType === 'send-acp-sudt-to-new-cell' || actionType === 'send-acp-ckb-to-new-cell') {
              skipLastInputs = false
            }
            const params: Controller.SendSUDTTransaction.Params = {
              walletID,
              tx: experimental?.tx,
              password,
              skipLastInputs,
            }
            await sendSUDTTransaction(params)(dispatch).then(handleSendTxRes)
            break
          }
          case 'destroy-asset-account':
          case 'send-nft':
          case 'send-cheque': {
            if (isSending) {
              break
            }
            await sendTransaction({
              walletID,
              tx: experimental?.tx,
              description: experimental?.tx?.description,
              password,
            })(dispatch).then(handleSendTxRes)
            break
          }
          case 'claim-cheque': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: experimental?.tx, password })(dispatch).then(handleSendTxRes)
            break
          }
          case 'create-account-to-claim-cheque': {
            if (isSending) {
              break
            }
            await sendCreateSUDTAccountTransaction({
              walletID,
              password,
              tx: experimental?.tx,
              assetAccount: {
                ...experimental?.assetAccount,
                tokenID: experimental?.assetAccount.tokenId,
                balance: '0',
              },
            })(dispatch).then(handleSendTxRes)
            break
          }
          case 'withdraw-cheque': {
            if (isSending) {
              break
            }
            await sendTransaction({ walletID, tx: experimental?.tx, password })(dispatch).then(handleSendTxRes)
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
      actionType,
      description,
      navigate,
      isSending,
      generatedTx,
      disabled,
      experimental,
      setError,
      t,
      multisigConfig,
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
      multisigConfig,
    })
    dispatch({
      type: AppActions.UpdateLoadings,
      payload: { sending: false },
    })
    if (!isSuccessResponse(res)) {
      setError(errorFormatter(res.message, t))
      return
    }
    if (res.result) {
      dispatch({
        type: AppActions.UpdateLoadedTransaction,
        payload: res.result!,
      })
      onDismiss()
    }
  }, [description, dispatch, experimental, generatedTx, onDismiss, password, signType, t, walletID, multisigConfig])

  const dropdownList = [
    {
      text: t('offline-sign.sign-and-export'),
      onClick: signAndExportFromGenerateTx,
      disabled: !password,
    },
  ]

  if (!wallet) {
    return null
  }

  if (wallet.device) {
    return (
      <HardwareSign
        signType="transaction"
        navigate={navigate}
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
        {[
          'unlock',
          'create-sudt-account',
          'send-sudt',
          'send-acp-ckb-to-new-cell',
          'send-acp-sudt-to-new-cell',
          'send-cheque',
          'withdraw-cheque',
          'claim-cheque',
          'create-account-to-claim-cheque',
          'migrate-acp',
          'send-from-multisig-need-one',
          'send-from-multisig',
        ].includes(actionType ?? '') ? null : (
          <div className={styles.walletName}>{wallet ? wallet.name : null}</div>
        )}
        {currentWallet.isWatchOnly && (
          <div className={styles.xpubNotice}>
            <Attention />
            {t('password-request.xpub-notice')}
          </div>
        )}
        {currentWallet.isWatchOnly || (
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
        )}
        <div className={styles.footer}>
          {signType !== OfflineSignType.Invalid ? (
            <div className={styles.left}>
              <DropdownButton
                mainBtnLabel={t('offline-sign.export')}
                mainBtnOnClick={exportTransaction}
                mainBtnDisabled={isLoading}
                list={currentWallet.isWatchOnly ? [] : dropdownList}
              />
            </div>
          ) : null}
          <div className={styles.right}>
            <Button label={t('common.cancel')} type="cancel" onClick={onDismiss} />
            {signType === OfflineSignType.SendFromMultisigOnlySig || currentWallet.isWatchOnly || (
              <Button label={t('common.confirm')} type="submit" disabled={disabled}>
                {isLoading ? <Spinner /> : (t('common.confirm') as string)}
              </Button>
            )}
          </div>
        </div>
      </form>
    </dialog>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
