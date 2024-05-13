import React, { useCallback, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  connectDevice,
  getDevices,
  getDeviceCkbAppVersion,
  getDevicePublicKey,
  DeviceInfo,
  updateWallet,
  getPlatform,
} from 'services/remote'
import { ErrorCode, clsx, errorFormatter, isSuccessResponse, addressToAddress, useDidMount } from 'utils'
import { CkbAppNotFoundException, DeviceNotFoundException } from 'exceptions'
import Alert from 'widgets/Alert'
import styles from './receive.module.scss'

export interface VerifyHardwareAddressProps {
  address: string
  wallet: State.WalletIdentity
  onClose?: () => void
}

const verifyAddressEqual = (source: string, target?: string) => {
  if (!target) {
    return false
  }
  if (source.length !== target.length) {
    return addressToAddress(source) === addressToAddress(target)
  }
  return source === target
}

const VerifyHardwareAddress = ({ address, wallet, onClose = () => {} }: VerifyHardwareAddressProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const isWin32 = useMemo(() => {
    return getPlatform() === 'win32'
  }, [])
  const [status, setStatus] = useState<{ type: 'init' | 'success' | 'error'; message: string } | undefined>()
  const userInputStatus = t('hardware-verify-address.status.user-input')
  const disconnectStatus = t('hardware-verify-address.status.disconnect')
  const ckbAppNotFoundStatus = t(CkbAppNotFoundException.message)
  const isNotAvailableToVerify = useMemo(() => {
    return status?.message === disconnectStatus || status?.message === ckbAppNotFoundStatus
  }, [status, disconnectStatus, ckbAppNotFoundStatus])

  const [deviceInfo, setDeviceInfo] = useState(wallet.device!)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const isLoading = useMemo(() => {
    return status?.message === userInputStatus || isReconnecting
  }, [status, userInputStatus, isReconnecting])

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
        setStatus({ type: 'init', message: '' })
      } catch (err) {
        if (err instanceof CkbAppNotFoundException) {
          setStatus({ type: 'error', message: ckbAppNotFoundStatus })
        } else {
          setStatus({ type: 'error', message: disconnectStatus })
        }
      }
    },
    [disconnectStatus, ckbAppNotFoundStatus, isWin32]
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
      setStatus({ type: 'error', message: disconnectStatus })
    } finally {
      setIsReconnecting(false)
    }
  }, [deviceInfo, disconnectStatus, ensureDeviceAvailable, wallet.id])

  const [isVerifySuccess, setIsVerifySuccess] = useState(false)
  const verify = useCallback(async () => {
    await ensureDeviceAvailable(deviceInfo)
    setStatus({ type: 'init', message: userInputStatus })
    const res = await getDevicePublicKey()
    if (isSuccessResponse(res)) {
      const { result } = res
      if (verifyAddressEqual(address, result?.address)) {
        setIsVerifySuccess(true)
        setStatus({ type: 'success', message: t('hardware-verify-address.verified') })
      } else {
        setStatus({ type: 'error', message: t('hardware-verify-address.invalid') })
      }
    } else {
      setStatus({ type: 'error', message: errorFormatter(res.message, t) })
    }
  }, [deviceInfo, address, userInputStatus, ensureDeviceAvailable, t])

  useDidMount(() => {
    dialogRef.current?.showModal()
    ensureDeviceAvailable(deviceInfo)
  })

  return (
    <div className={styles.verifyHardwareAddress}>
      {isNotAvailableToVerify ? (
        <Button
          label={t('hardware-verify-address.actions.reconnect')}
          type="submit"
          onClick={reconnect}
          loading={isLoading}
        >
          {t('hardware-verify-address.actions.reconnect')}
        </Button>
      ) : (
        <>
          {isVerifySuccess ? (
            <Button type="submit" onClick={onClose}>
              {t('hardware-verify-address.actions.close')}
            </Button>
          ) : (
            <Button type="submit" loading={isLoading} onClick={verify}>
              {t('hardware-verify-address.actions.verify')}
            </Button>
          )}
        </>
      )}
      {status && status.message ? (
        <Alert status={status.type} className={clsx(styles.alert, { [styles.success]: status.type === 'success' })}>
          {status.message}
        </Alert>
      ) : null}
    </div>
  )
}

VerifyHardwareAddress.displayName = 'VerifyHardwareAddress'

export default VerifyHardwareAddress
