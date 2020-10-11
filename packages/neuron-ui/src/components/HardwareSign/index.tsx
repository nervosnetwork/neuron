import React, { useCallback, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import {
  useState as useGlobalState,
  useDispatch,
  sendTransaction,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
  AppActions,
} from 'states'
import Spinner from 'widgets/Spinner'
import { useHistory } from 'react-router-dom'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import {
  connectDevice,
  getDevices,
  exportTransactionAsJSON,
  OfflineSignStatus,
  OfflineSignType,
  OfflineSignJSON,
  signAndExportTransaction,
} from 'services/remote'
import { errorFormatter, isSuccessResponse, RoutePath, useDidMount } from 'utils'
import DropdownButton from 'widgets/DropdownButton'
import SignError from './sign-error'
import HDWalletSign from '../HDWalletSign'
import styles from './hardwareSign.module.scss'

export type SignType = 'message' | 'transaction'

export interface HardwareSignProps {
  signType: SignType
  wallet: State.WalletIdentity
  offlineSignJSON?: OfflineSignJSON
  offlineSignType?: OfflineSignType
  onDismiss: () => void
  signMessage?: (password: string) => Promise<any>
  history?: ReturnType<typeof useHistory>
}

const HardwareSign = ({
  signType,
  signMessage,
  history,
  wallet,
  onDismiss,
  offlineSignJSON,
  offlineSignType,
}: HardwareSignProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const dispatch = useDispatch()
  const onCancel = useCallback(() => {
    if (signType === 'transaction') {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: { sending: false },
      })
    }
    onDismiss()
  }, [dispatch, signType, onDismiss])
  const connectStatus = t('hardware-sign.status.connect')
  const disconnectStatus = t('hardware-sign.status.disconnect')
  const userInputStatus = t('hardware-sign.status.user-input')

  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { actionType = null },
    },
    experimental,
  } = useGlobalState()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [deviceInfo, setDeviceInfo] = useState(wallet.device!)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const isSigning = useMemo(() => {
    return status === userInputStatus
  }, [status, userInputStatus])

  const productName = `${wallet.device!.manufacturer} ${wallet.device!.product}`

  const offlineSignActionType = useMemo(() => {
    switch (offlineSignJSON?.type) {
      case OfflineSignType.CreateSUDTAccount:
        return 'create-sudt-account'
      case OfflineSignType.SendSUDT:
        return 'send-sudt'
      case OfflineSignType.UnlockDAO:
        return 'unlock'
      default:
        return 'send'
    }
  }, [offlineSignJSON])

  const signAndExportFromJSON = useCallback(async () => {
    const res = await signAndExportTransaction({
      ...offlineSignJSON!,
      walletID: wallet.id,
      password: '',
    })
    if (!isSuccessResponse(res)) {
      setError(errorFormatter(res.message, t))
      return
    }
    dispatch({
      type: AppActions.UpdateLoadedTransaction,
      payload: {
        json: res.result!,
      },
    })
    onCancel()
  }, [offlineSignJSON, dispatch, onCancel, t, wallet.id])

  const signAndExportFromGenerateTx = useCallback(async () => {
    setStatus(userInputStatus)
    const json: OfflineSignJSON = {
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Signed,
      type: offlineSignType!,
      description,
      asset_account: experimental?.assetAccount,
    }
    const res = await signAndExportTransaction({
      ...json,
      walletID: wallet.id,
      password: '',
    })
    if (!isSuccessResponse(res)) {
      setStatus(connectStatus)
      setError(errorFormatter(res.message, t))
      return
    }
    dispatch({
      type: AppActions.UpdateLoadedTransaction,
      payload: {
        json: res.result!,
      },
    })
    onCancel()
  }, [
    dispatch,
    onCancel,
    t,
    wallet.id,
    generatedTx,
    userInputStatus,
    description,
    experimental,
    offlineSignType,
    connectStatus,
  ])

  const signTx = useCallback(async () => {
    try {
      const conectionRes = await connectDevice(deviceInfo)
      if (!isSuccessResponse(conectionRes)) {
        setStatus(disconnectStatus)
        return
      }
      setStatus(userInputStatus)
      const type = actionType || offlineSignActionType
      const tx = offlineSignJSON?.transaction ?? generatedTx
      // eslint-disable-next-line camelcase
      const assetAccount = offlineSignJSON?.asset_account ?? experimental?.assetAccount
      if (offlineSignJSON !== undefined) {
        await signAndExportFromJSON()
        return
      }
      switch (type) {
        case 'send': {
          if (isSending) {
            break
          }
          sendTransaction({ walletID: wallet.id, tx, description })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'unlock': {
          if (isSending) {
            break
          }
          sendTransaction({ walletID: wallet.id, tx, description })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'create-sudt-account': {
          const params: Controller.SendCreateSUDTAccountTransaction.Params = {
            walletID: wallet.id,
            assetAccount,
            tx: tx ?? experimental?.tx,
          }
          sendCreateSUDTAccountTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'send-acp':
        case 'send-sudt': {
          const params: Controller.SendSUDTTransaction.Params = {
            walletID: wallet.id,
            tx: tx ?? experimental?.tx,
          }
          sendSUDTTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              history!.push(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        default: {
          break
        }
      }
    } catch (err) {
      setStatus(disconnectStatus)
    }
  }, [
    actionType,
    offlineSignActionType,
    userInputStatus,
    disconnectStatus,
    experimental,
    generatedTx,
    offlineSignJSON,
    isSending,
    deviceInfo,
    wallet.id,
    description,
    dispatch,
    history,
    signAndExportFromJSON,
  ])

  const signMsg = useCallback(async () => {
    const conectionRes = await connectDevice(deviceInfo)
    if (!isSuccessResponse(conectionRes)) {
      setStatus(disconnectStatus)
      return
    }
    setStatus(userInputStatus)
    await signMessage?.('')
  }, [userInputStatus, deviceInfo, disconnectStatus, signMessage])

  const sign = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }
      if (signType === 'message') {
        await signMsg()
      } else {
        await signTx()
      }
    },
    [signType, signTx, signMsg]
  )

  const reconnect = useCallback(async () => {
    setIsReconnecting(true)
    try {
      const res = await getDevices(deviceInfo)
      if (isSuccessResponse(res) && Array.isArray(res.result) && res.result.length > 0) {
        const [device] = res.result
        setDeviceInfo(device)
        setStatus(connectStatus)
      }
    } catch (err) {
      setStatus(disconnectStatus)
    } finally {
      setIsReconnecting(false)
    }
  }, [deviceInfo, disconnectStatus, connectStatus])

  const exportTransaction = useCallback(async () => {
    await exportTransactionAsJSON({
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Unsigned,
      type: offlineSignType!,
      description,
      asset_account: experimental?.assetAccount,
    })
    onCancel()
  }, [offlineSignType, generatedTx, onCancel, description, experimental])

  useDidMount(() => {
    // eslint-disable-next-line no-unused-expressions
    dialogRef.current?.showModal()
    connectDevice(deviceInfo)
      .then(res => {
        if (isSuccessResponse(res)) {
          setStatus(connectStatus)
        } else {
          setStatus(disconnectStatus)
        }
      })
      .catch(() => {
        setStatus(disconnectStatus)
      })
  })

  const dialogClass = `${styles.dialog} ${wallet.isHD ? styles.hd : ''}`

  const dropdownList = [
    {
      text: t('offline-sign.sign-and-export'),
      onClick: signAndExportFromGenerateTx,
    },
  ]

  let container = (
    <div className={styles.container}>
      <header className={styles.title}>{t('hardware-sign.title')}</header>
      <section className={styles.main}>
        <table>
          <tbody>
            <tr>
              <td className={styles.first}>{t('hardware-sign.device')}</td>
              <td>
                <HardWalletIcon />
                <span>{productName}</span>
              </td>
            </tr>
            <tr>
              <td className={styles.first}>{t('hardware-sign.status.label')}</td>
              <td className={status === disconnectStatus ? styles.warning : ''}>{status}</td>
            </tr>
          </tbody>
        </table>
        {wallet.isHD ? <HDWalletSign tx={generatedTx} /> : null}
      </section>
      <footer className={styles.footer}>
        {offlineSignJSON === undefined && signType === 'transaction' ? (
          <div className={styles.left}>
            <DropdownButton
              mainBtnLabel={t('offline-sign.export')}
              mainBtnOnClick={exportTransaction}
              mainBtnDisabled={isSigning}
              list={dropdownList}
            />
          </div>
        ) : null}
        <div className={styles.right}>
          <Button type="cancel" label={t('hardware-sign.cancel')} onClick={onCancel} />
          {status === disconnectStatus ? (
            <Button
              label={t('hardware-sign.actions.rescan')}
              type="submit"
              disabled={isReconnecting || isSigning}
              onClick={reconnect}
            >
              {isReconnecting || isSigning ? <Spinner /> : (t('hardware-sign.actions.rescan') as string)}
            </Button>
          ) : (
            <Button label={t('sign-and-verify.sign')} type="submit" disabled={isSigning} onClick={sign}>
              {isSigning ? <Spinner /> : (t('sign-and-verify.sign') as string)}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )

  if (error) {
    container = <SignError onCancel={onCancel} error={error} />
  }

  return (
    <dialog ref={dialogRef} className={dialogClass}>
      {container}
    </dialog>
  )
}

HardwareSign.displayName = 'HardwareSign'

export default HardwareSign
