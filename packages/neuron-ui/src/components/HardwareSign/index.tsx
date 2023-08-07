import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useState as useGlobalState,
  useDispatch,
  sendTransaction,
  sendCreateSUDTAccountTransaction,
  sendSUDTTransaction,
  AppActions,
  migrateAcp,
} from 'states'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { NavigateFunction } from 'react-router-dom'
import {
  connectDevice,
  getDevices,
  exportTransactionAsJSON,
  OfflineSignStatus,
  OfflineSignType,
  OfflineSignJSON,
  signAndExportTransaction,
  getDeviceCkbAppVersion,
  DeviceInfo,
  updateWallet,
  getPlatform,
} from 'services/remote'
import { ErrorCode, errorFormatter, isSuccessResponse, RoutePath, useDidMount } from 'utils'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import Button from 'widgets/Button'
import { Export, Sign } from 'widgets/Icons/icon'
import { CkbAppNotFoundException, DeviceNotFoundException } from 'exceptions'
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
  navigate?: NavigateFunction
}

const HardwareSign = ({
  signType,
  signMessage,
  navigate,
  wallet,
  onDismiss,
  offlineSignJSON,
  offlineSignType,
}: HardwareSignProps) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const onCancel = useCallback(
    (dismiss: boolean = true) => {
      if (signType === 'transaction') {
        dispatch({
          type: AppActions.UpdateLoadings,
          payload: { sending: false },
        })
      }
      if (dismiss) {
        onDismiss()
      }
    },
    [dispatch, signType, onDismiss]
  )
  const isWin32 = useMemo(() => {
    return getPlatform() === 'win32'
  }, [])
  const [status, setStatus] = useState('')
  const connectStatus = t('hardware-sign.status.connect')
  const userInputStatus = t('hardware-sign.status.user-input')
  const disconnectStatus = t('hardware-sign.status.disconnect')
  const ckbAppNotFoundStatus = t(CkbAppNotFoundException.message)
  const isNotAvailableToSign = useMemo(() => {
    return status === disconnectStatus || status === ckbAppNotFoundStatus
  }, [status, disconnectStatus, ckbAppNotFoundStatus])

  const {
    app: {
      send: { description, generatedTx },
      loadings: { sending: isSending = false },
      passwordRequest: { actionType = null, multisigConfig },
    },
    experimental,
  } = useGlobalState()
  const [error, setError] = useState('')
  const [deviceInfo, setDeviceInfo] = useState(wallet.device!)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const isLoading = useMemo(() => {
    return status === userInputStatus || isReconnecting || isSending
  }, [status, userInputStatus, isReconnecting])

  const productName = `${wallet.device!.manufacturer} ${wallet.device!.product}`

  const offlineSignActionType = useMemo(() => {
    switch (offlineSignJSON?.type) {
      case OfflineSignType.CreateSUDTAccount:
        return 'create-sudt-account'
      case OfflineSignType.SendSUDT:
        return 'send-sudt'
      case OfflineSignType.UnlockDAO:
        return 'unlock'
      case OfflineSignType.SendFromMultisigOnlySig:
        return 'send-from-multisig'
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
    if (res.result) {
      dispatch({
        type: AppActions.UpdateLoadedTransaction,
        payload: res.result!,
      })
    }
    onCancel(!!res.result)
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
      multisigConfig,
    })
    setStatus(connectStatus)
    if (!isSuccessResponse(res)) {
      setStatus(connectStatus)
      setError(errorFormatter(res.message, t))
      return
    }
    if (res.result) {
      dispatch({
        type: AppActions.UpdateLoadedTransaction,
        payload: res.result!,
      })
    }
    onCancel(!!res.result)
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
    multisigConfig,
  ])

  const ensureDeviceAvailable = useCallback(
    async (device: DeviceInfo) => {
      try {
        const connectionRes = await connectDevice(device)
        let { descriptor } = device
        if (!isSuccessResponse(connectionRes)) {
          // for win32, opening or closing the ckb app changes the HID descriptor(deviceInfo),
          // so if we can't connect to the device, we need to re-search device automatically.
          // for unix, the descriptor never changes unless user plugs the device into another USB port,
          // in that case, mannauly re-search device one time will do.
          if (isWin32) {
            setIsReconnecting(true)
            const devicesRes = await getDevices(device)
            setIsReconnecting(false)
            if (isSuccessResponse(devicesRes) && Array.isArray(devicesRes.result) && devicesRes.result.length > 0) {
              const [updatedDeviceInfo] = devicesRes.result
              descriptor = updatedDeviceInfo.descriptor
              setDeviceInfo(updatedDeviceInfo)
            } else {
              throw new DeviceNotFoundException()
            }
          } else {
            throw new DeviceNotFoundException()
          }
        }

        // getDeviceCkbAppVersion will halt forever while in win32 sleep mode.
        const ckbVersionRes = await Promise.race([
          getDeviceCkbAppVersion(descriptor),
          new Promise<ControllerResponse>((_, reject) => {
            setTimeout(() => reject(), 1000)
          }),
        ]).catch(() => {
          return { status: ErrorCode.DeviceInSleep }
        })

        if (!isSuccessResponse(ckbVersionRes)) {
          if (ckbVersionRes.status !== ErrorCode.DeviceInSleep) {
            throw new CkbAppNotFoundException()
          } else {
            throw new DeviceNotFoundException()
          }
        }
        setStatus(connectStatus)
      } catch (err) {
        if (err instanceof CkbAppNotFoundException) {
          setStatus(ckbAppNotFoundStatus)
        } else {
          setStatus(disconnectStatus)
        }
      }
    },
    [connectStatus, disconnectStatus, ckbAppNotFoundStatus, isWin32]
  )

  const signTx = useCallback(async () => {
    try {
      await ensureDeviceAvailable(deviceInfo)
      setStatus(userInputStatus)
      const type = actionType || offlineSignActionType
      const tx = offlineSignJSON?.transaction || generatedTx
      // eslint-disable-next-line camelcase
      const assetAccount = offlineSignJSON?.asset_account ?? experimental?.assetAccount
      if (offlineSignJSON !== undefined) {
        await signAndExportFromJSON()
        return
      }
      switch (type) {
        case 'send':
        case 'send-nft':
        case 'destroy-asset-account':
        case 'send-cheque':
        case 'claim-cheque': {
          if (isSending) {
            break
          }
          sendTransaction({
            walletID: wallet.id,
            tx: tx || experimental?.tx,
            description,
          })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              navigate?.(RoutePath.History)
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
              navigate?.(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'create-sudt-account':
        case 'create-account-to-claim-cheque': {
          const params: Controller.SendCreateSUDTAccountTransaction.Params = {
            walletID: wallet.id,
            assetAccount,
            tx: tx || experimental?.tx,
          }
          sendCreateSUDTAccountTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              navigate?.(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'send-ckb-asset':
        case 'send-acp-sudt-to-new-cell':
        case 'send-acp-ckb-to-new-cell':
        case 'send-sudt': {
          let skipLastInputs = true
          if (actionType === 'send-acp-sudt-to-new-cell' || actionType === 'send-acp-ckb-to-new-cell') {
            skipLastInputs = false
          }
          const params: Controller.SendSUDTTransaction.Params = {
            walletID: wallet.id,
            tx: tx || experimental?.tx,
            skipLastInputs,
          }
          sendSUDTTransaction(params)(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              navigate?.(RoutePath.History)
            } else {
              setError(res.message)
            }
          })
          break
        }
        case 'migrate-acp': {
          await migrateAcp({ id: wallet.id })(dispatch).then(res => {
            if (isSuccessResponse(res)) {
              navigate?.(RoutePath.History)
            } else {
              setError(typeof res.message === 'string' ? res.message : res.message.content ?? 'migrate-acp error')
            }
          })
          break
        }
        case 'send-from-multisig-need-one': {
          if (isSending) {
            break
          }
          await sendTransaction({ walletID: wallet.id, tx: generatedTx, description, multisigConfig })(dispatch).then(
            res => {
              if (!isSuccessResponse(res)) {
                setError(res.message.content)
              }
            }
          )
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
    navigate,
    signAndExportFromJSON,
    ensureDeviceAvailable,
    multisigConfig,
  ])

  const signMsg = useCallback(async () => {
    await ensureDeviceAvailable(deviceInfo)
    setStatus(userInputStatus)
    await signMessage?.('')
  }, [ensureDeviceAvailable, signMessage, deviceInfo, userInputStatus])

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
        if (device.descriptor !== deviceInfo.descriptor) {
          await updateWallet({
            id: wallet.id,
            device,
          })
        }
        await ensureDeviceAvailable(device)
      }
    } catch (err) {
      setStatus(disconnectStatus)
    } finally {
      setIsReconnecting(false)
    }
  }, [deviceInfo, disconnectStatus, ensureDeviceAvailable, wallet.id])

  const exportTransaction = useCallback(async () => {
    const res = await exportTransactionAsJSON({
      transaction: generatedTx || experimental?.tx,
      status: OfflineSignStatus.Unsigned,
      type: offlineSignType!,
      description,
      asset_account: experimental?.assetAccount,
    })
    if (!isSuccessResponse(res)) {
      setError(errorFormatter(res.message, t))
      return
    }
    onCancel(!!res.result)
  }, [offlineSignType, generatedTx, onCancel, description, experimental])

  useDidMount(() => {
    ensureDeviceAvailable(deviceInfo)
  })

  if (error) {
    return <AlertDialog show message={error} type="failed" onCancel={onCancel} />
  }

  return (
    <Dialog
      show
      title={t('hardware-sign.title')}
      onCancel={onCancel}
      showConfirm={(actionType || offlineSignActionType) !== 'send-from-multisig'}
      confirmText={isNotAvailableToSign ? t('hardware-sign.actions.rescan') : t('sign-and-verify.sign')}
      isLoading={isLoading}
      onConfirm={isNotAvailableToSign ? reconnect : sign}
    >
      <div className={styles.container}>
        <p>
          {t('hardware-sign.device')}
          <span>{productName}</span>
        </p>
        <p>
          {t('hardware-sign.status.label')}
          <span className={isNotAvailableToSign ? styles.warning : ''}>{status}</span>
        </p>

        <div>{wallet.isHD && generatedTx ? <HDWalletSign tx={generatedTx} /> : null}</div>

        {offlineSignJSON === undefined && signType === 'transaction' ? (
          <div className={styles.footer}>
            <Button type="text" onClick={exportTransaction} disabled={isLoading}>
              {t('offline-sign.export')} <Export />
            </Button>
            <div className={styles.divider} />
            <Button
              type="text"
              className={styles.signAndExportFromGenerateTx}
              onClick={signAndExportFromGenerateTx}
              disabled={isNotAvailableToSign}
              loading={!isNotAvailableToSign && isLoading}
            >
              {t('offline-sign.sign-and-export')} <Sign />
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}

HardwareSign.displayName = 'HardwareSign'

export default HardwareSign
