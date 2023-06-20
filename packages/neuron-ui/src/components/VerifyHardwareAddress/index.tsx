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
import { ErrorCode, errorFormatter, isSuccessResponse, useDidMount } from 'utils'
import { CkbAppNotFoundException, DeviceNotFoundException } from 'exceptions'
// import { ADDRESS_LENGTH } from 'utils/const'
import { AddressPrefix, addressToScript, scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { ReactComponent as Device } from 'widgets/Icons/Device.svg'
import { Close } from 'widgets/Icons/icon'
import Alert from 'widgets/Alert'
import CopyZoneAddress from 'widgets/CopyZoneAddress'
import styles from './verifyHardwareAddress.module.scss'

export interface VerifyHardwareAddressProps {
  address: string
  wallet: State.WalletIdentity
  onDismiss: () => void
}

const toLongAddr = (addr: string) => {
  try {
    const script = addressToScript(addr)
    const isMainnet = addr.startsWith(AddressPrefix.Mainnet)
    return scriptToAddress(script, isMainnet)
  } catch {
    return ''
  }
}

const verifyAddressEqual = (address: string, compared?: string) => {
  if (!compared) {
    return false
  }
  if (address.length !== compared.length) {
    return toLongAddr(address) === toLongAddr(compared)
  }
  return address === compared
}

const VerifyHardwareAddress = ({ address, wallet, onDismiss }: VerifyHardwareAddressProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  // const dispatch = useDispatch()
  const onCancel = useCallback(() => {
    onDismiss()
  }, [onDismiss])
  const isWin32 = useMemo(() => {
    return getPlatform() === 'win32'
  }, [])
  const [status, setStatus] = useState<{ type: 'init' | 'success' | 'error'; message: string } | undefined>()
  const connectStatus = t('hardware-verify-address.status.connect')
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

  const productName = `${wallet.device!.manufacturer} ${wallet.device!.product}`

  const ensureDeviceAvailable = useCallback(
    async (device: DeviceInfo) => {
      try {
        const conectionRes = await connectDevice(device)
        let { descriptor } = device
        if (!isSuccessResponse(conectionRes)) {
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
        setStatus({ type: 'init', message: connectStatus })
      } catch (err) {
        if (err instanceof CkbAppNotFoundException) {
          setStatus({ type: 'error', message: ckbAppNotFoundStatus })
        } else {
          setStatus({ type: 'error', message: disconnectStatus })
        }
      }
    },
    [connectStatus, disconnectStatus, ckbAppNotFoundStatus, isWin32]
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

  const [isVerifyAgain, setIsVerifyAgain] = useState(false)
  const verify = useCallback(async () => {
    setIsVerifyAgain(true)
    await ensureDeviceAvailable(deviceInfo)
    setStatus({ type: 'init', message: userInputStatus })
    const res = await getDevicePublicKey()
    if (isSuccessResponse(res)) {
      const { result } = res
      if (verifyAddressEqual(address, result?.address)) {
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
    <dialog ref={dialogRef} className={styles.dialog}>
      <header className={styles.title}>
        {t('hardware-verify-address.title')}
        <Close onClick={onCancel} />
      </header>
      <div className={styles.divider} />
      <div className={styles.body}>
        <section className={styles.main}>
          <header>{t('hardware-verify-address.device')}</header>
          <input value={productName} className={styles.productName} disabled />
          <header>{t('hardware-verify-address.address')}</header>
          <CopyZoneAddress fullPayload={address} className={styles.address} />
          {status ? (
            <Alert status={status.type} className={styles.alert}>
              {status.message === connectStatus ? <Device /> : null}
              {status.message}
            </Alert>
          ) : null}
        </section>
        <footer className={styles.footer}>
          <Button type="cancel" label={t('hardware-verify-address.actions.close')} onClick={onCancel} />
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
            <Button
              label={t('hardware-verify-address.actions.verify')}
              type="submit"
              loading={isLoading}
              onClick={verify}
            >
              {isVerifyAgain
                ? t('hardware-verify-address.actions.verify-again')
                : t('hardware-verify-address.actions.verify')}
            </Button>
          )}
        </footer>
      </div>
    </dialog>
  )
}

VerifyHardwareAddress.displayName = 'VerifyHardwareAddress'

export default VerifyHardwareAddress
