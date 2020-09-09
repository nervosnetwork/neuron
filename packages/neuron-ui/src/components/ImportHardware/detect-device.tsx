import React, { useCallback, useState } from 'react'
import { useHistory, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { getDevices, getFirmwareVersion, getCkbAppVersion, connectDevice } from 'services/remote'
import { isSuccessResponse, useDidMount } from 'utils'
import { ReactComponent as SuccessInfo } from 'widgets/Icons/SuccessInfo.svg'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import { RoutePath, LocationState } from './common'

import styles from './findDevice.module.scss'

enum ErrorType {
  MultiDevice,
  DeviceNotFound,
  CkbAppNotFound,
}

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
  const [errorType, setErrorType] = useState<ErrorType>(-1)
  const [appVersion, setAppVersion] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')

  const findDevice = useCallback(async () => {
    setErrorType(-1)
    setScaning(true)
    const res = await getDevices(model)
    if (isSuccessResponse(res) && Array.isArray(res.result) && res.result.length > 0) {
      const [device, ...rest] = res.result
      if (rest.length > 0) {
        setErrorType(ErrorType.MultiDevice)
        setScaning(false)
        return
      }
      const conectionRes = await connectDevice(device)
      if (!isSuccessResponse(conectionRes)) {
        setErrorType(ErrorType.MultiDevice)
        setScaning(false)
        return
      }
      const firmwareVersionRes = await getFirmwareVersion(device.descriptor)
      if (isSuccessResponse(firmwareVersionRes)) {
        setFirmwareVersion(firmwareVersionRes.result!)
      }
      const ckbVersionRes = await getCkbAppVersion(device.descriptor)
      if (isSuccessResponse(ckbVersionRes)) {
        setAppVersion(ckbVersionRes.result!)
      } else {
        setErrorType(ErrorType.CkbAppNotFound)
      }
    } else {
      setErrorType(ErrorType.DeviceNotFound)
    }
    setScaning(false)
  }, [model])

  useDidMount(() => {
    findDevice()
  })

  const onNext = useCallback(() => {
    history.push({
      pathname: entryPath + RoutePath.Comfirming,
      state: location.state,
    })
  }, [history, entryPath, location.state])

  const errors = {
    [ErrorType.CkbAppNotFound]: t('import-hardware.errors.ckb-app-not-found'),
    [ErrorType.DeviceNotFound]: t('import-hardware.errors.device-not-found'),
    [ErrorType.MultiDevice]: t('import-hardware.errors.multi-device'),
  }

  const errorMsg = errors[errorType]
  const ready = errorMsg === undefined && appVersion !== ''
  const productName = `${model.manufacturer} ${model.product}`

  return (
    <form onSubmit={onNext} className={styles.container}>
      <header className={styles.title}>{t('import-hardware.title.detect-device')}</header>
      <section className={styles.detect}>
        <h3 className={styles.model}>{productName}</h3>
        {errorMsg ? <Info isError msg={errors[errorType]} /> : null}
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
