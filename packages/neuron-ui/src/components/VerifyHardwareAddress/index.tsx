import React, { useCallback, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import Spinner from 'widgets/Spinner'
import { ReactComponent as HardWalletIcon } from 'widgets/Icons/HardWallet.svg'
import { ReactComponent as VerifiedIcon } from 'widgets/Icons/Success.svg'
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
import CopyZone from 'widgets/CopyZone'
import styles from './verifyHardwareAddress.module.scss'
import VerifyError from './verify-error'

export interface VerifyHardwareAddressProps {
  address: string
  wallet: State.WalletIdentity
  onDismiss: () => void
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
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const connectStatus = t('hardware-verify-address.status.connect')
  const userInputStatus = t('hardware-verify-address.status.user-input')
  const disconnectStatus = t('hardware-verify-address.status.disconnect')
  const verifiedStatus = t('hardware-verify-address.verified')
  const invalidStatus = t('hardware-verify-address.invalid')
  const ckbAppNotFoundStatus = t(CkbAppNotFoundException.message)
  const isNotAvailableToVerify = useMemo(() => {
    return status === disconnectStatus || status === ckbAppNotFoundStatus
  }, [status, disconnectStatus, ckbAppNotFoundStatus])

  const [deviceInfo, setDeviceInfo] = useState(wallet.device!)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const isLoading = useMemo(() => {
    return status === userInputStatus || isReconnecting
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
        setStatus(connectStatus)
      } catch (err) {
        if (err instanceof CkbAppNotFoundException && err.code === ErrorCode.CkbAppNotFound) {
          setStatus(ckbAppNotFoundStatus)
        } else {
          setStatus(disconnectStatus)
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
      setStatus(disconnectStatus)
    } finally {
      setIsReconnecting(false)
    }
  }, [deviceInfo, disconnectStatus, ensureDeviceAvailable, wallet.id])

  const verify = useCallback(async () => {
    await ensureDeviceAvailable(deviceInfo)
    setStatus(userInputStatus)
    const res = await getDevicePublicKey()
    if (isSuccessResponse(res)) {
      const { result } = res
      if (result?.address === address) {
        setStatus(verifiedStatus)
      } else {
        setStatus(invalidStatus)
      }
    } else {
      setError(errorFormatter(res.message, t))
    }
  }, [deviceInfo, address, userInputStatus, verifiedStatus, invalidStatus, ensureDeviceAvailable, t])

  useDidMount(() => {
    // @ts-ignore
    dialogRef.current?.showModal()
    ensureDeviceAvailable(deviceInfo)
  })

  const dialogClass = `${styles.dialog}`

  let container = (
    <div className={styles.container}>
      <header className={styles.title}>{t('hardware-verify-address.title')}</header>
      <section className={styles.main}>
        <table>
          <tbody>
            <tr>
              <td className={styles.first}>{t('hardware-verify-address.device')}</td>
              <td>
                <HardWalletIcon />
                <span>{productName}</span>
              </td>
            </tr>
            <tr>
              <td className={styles.first}>{t('hardware-verify-address.address')}</td>
              <td className={isNotAvailableToVerify ? styles.warning : ''}>
                <CopyZone
                  content={address}
                  name={t('hardware-verify-address.actions.copy-address')}
                  style={{ lineHeight: '1.625rem' }}
                >
                  {address}
                </CopyZone>
              </td>
            </tr>
            <tr>
              <td className={styles.first}>{t('hardware-verify-address.status.label')}</td>
              <td className={isNotAvailableToVerify ? styles.warning : ''}>
                {status === verifiedStatus && <VerifiedIcon />}
                <span>{status}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <footer className={styles.footer}>
        <div className={styles.right}>
          <Button type="cancel" label={t('hardware-verify-address.actions.close')} onClick={onCancel} />
          {isNotAvailableToVerify ? (
            <Button
              label={t('hardware-verify-address.actions.rescan')}
              type="submit"
              disabled={isLoading}
              onClick={reconnect}
            >
              {isLoading ? <Spinner /> : (t('hardware-verify-address.actions.rescan') as string)}
            </Button>
          ) : (
            <Button
              label={t('hardware-verify-address.actions.verify')}
              type="submit"
              disabled={isLoading}
              onClick={verify}
            >
              {isLoading ? <Spinner /> : (t('hardware-verify-address.actions.verify') as string)}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )

  if (error) {
    container = <VerifyError onCancel={onCancel} error={error} />
  }

  return (
    <dialog ref={dialogRef} className={dialogClass}>
      {container}
    </dialog>
  )
}

VerifyHardwareAddress.displayName = 'VerifyHardwareAddress'

export default VerifyHardwareAddress
