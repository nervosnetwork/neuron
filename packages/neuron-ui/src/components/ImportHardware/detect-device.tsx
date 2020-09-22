import React, { useCallback, useState } from 'react'
import { useHistory, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { getDevices, getDeviceFirmwareVersion, getDeviceCkbAppVersion, connectDevice } from 'services/remote'
import { isSuccessResponse, useDidMount } from 'utils'
import { ReactComponent as SuccessInfo } from 'widgets/Icons/SuccessInfo.svg'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import {
  CkbAppNotFoundException,
  ConnectFailedException,
  DeviceNotFoundException,
  MultiDeviceException,
} from 'exceptions'
import { RoutePath, LocationState } from './common'

import styles from './findDevice.module.scss'

const Info = (
  { isError, isScaning, msg }: { isError?: boolean; isScaning?: boolean; msg: string } = {
    isError: false,
    isScaning: false,
    msg: '',
  }
) => {
  const [t] = useTranslation()
  if (isError) {
    return (
      <>
        <div className={styles.info}>
          <span>
            <FailedInfo />
          </span>
          <span className={styles.error}>{msg}</span>
        </div>
        <div className={styles.aborted}>{t('import-hardware.abort')}</div>
      </>
    )
  }
  return (
    <div className={styles.info}>
      <span>{isScaning ? null : <SuccessInfo />}</span>
      <span className={isScaning ? styles.scaning : ''}>{msg}</span>
    </div>
  )
}

const DetectDevice = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const histroy = useHistory()
  const { model, entryPath } = location.state
  const onBack = useCallback(() => {
    histroy.goBack()
  }, [histroy])

  const [scaning, setScaning] = useState(true)
  const [error, setError] = useState('')
  const [appVersion, setAppVersion] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')

  const findDevice = useCallback(async () => {
    setError('')
    setScaning(true)
    try {
      const res = await getDevices(model)
      if (isSuccessResponse(res) && Array.isArray(res.result) && res.result.length > 0) {
        const [device, ...rest] = res.result
        if (rest.length > 0) {
          setScaning(false)
          throw new MultiDeviceException()
        }
        const conectionRes = await connectDevice(device)
        if (!isSuccessResponse(conectionRes)) {
          setScaning(false)
          throw new ConnectFailedException()
        }
        const firmwareVersionRes = await getDeviceFirmwareVersion(device.descriptor)
        if (isSuccessResponse(firmwareVersionRes)) {
          setFirmwareVersion(firmwareVersionRes.result!)
        }
        const ckbVersionRes = await getDeviceCkbAppVersion(device.descriptor)
        if (isSuccessResponse(ckbVersionRes)) {
          setAppVersion(ckbVersionRes.result!)
        } else {
          throw new CkbAppNotFoundException()
        }
      } else {
        throw new DeviceNotFoundException()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setScaning(false)
    }
  }, [model, setError, setScaning])

  useDidMount(() => {
    findDevice()
  })

  const onNext = useCallback(() => {
    history.push({
      pathname: entryPath + RoutePath.Comfirming,
      state: location.state,
    })
  }, [history, entryPath, location.state])

  const errorMsg = t(error)
  const ready = error === '' && appVersion !== ''
  const productName = `${model.manufacturer} ${model.product}`

  return (
    <form onSubmit={onNext} className={styles.container}>
      <header className={styles.title}>{t('import-hardware.title.detect-device')}</header>
      <section className={styles.detect}>
        <h3 className={styles.model}>{productName}</h3>
        {errorMsg ? <Info isError msg={errorMsg} /> : null}
        {scaning ? <Info isScaning={scaning} msg={t('import-hardware.waiting')} /> : null}
        {firmwareVersion && !errorMsg && !scaning ? (
          <Info msg={t('import-hardware.firmware-version', { version: firmwareVersion })} />
        ) : null}
        {appVersion ? <Info msg={t('import-hardware.app-version', { version: appVersion })} /> : null}
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
        {errorMsg ? (
          <Button type="ok" label={t('import-hardware.actions.rescan')} onClick={findDevice} />
        ) : (
          <Button type="submit" label={t('import-hardware.actions.next')} onClick={onNext} disabled={!ready} />
        )}
      </footer>
    </form>
  )
}

DetectDevice.displayName = 'DetectDevice'

export default DetectDevice
