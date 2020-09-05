import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Switch, Route, useHistory, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import Dropdown from 'widgets/Dropdown'
import { getDevices, getFirmwareVersion, getCkbAppVersion, connectDevice } from 'services/remote'
import { isSuccessResponse } from 'utils'

import styles from './findDevice.module.scss'

enum RoutePath {
  DetectDevice = '/detect-device',
  Comfirming = '/confirming',
  Error = '/error',
  Success = '/success',
  NameWallet = '/name-wallet',
}

enum ErrorType {
  MultiDevice,
  DeviceNotFound,
  CkbAppNotFound,
}

const DetectDevice = ({ match, history, location }: RouteComponentProps<{}, {}, Model>) => {
  const [t] = useTranslation()
  const histroy = useHistory()
  const model = location.state
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

  useEffect(() => {
    findDevice()
  }, [])

  const onNext = useCallback(() => {
    history.push(match.url + RoutePath.Comfirming)
  }, [history, match.url])

  const errors = {
    [ErrorType.CkbAppNotFound]: t('import-hardware.errors.ckb-app-not-found'),
    [ErrorType.DeviceNotFound]: t('import-hardware.errors.device-not-found'),
    [ErrorType.MultiDevice]: t('import-hardware.errors.multi-device'),
  }

  const errorMsg = errors[errorType]
  const ready = errorMsg === undefined && appVersion !== ''
  const productName = `${model.manufacturer} ${model.product}`

  return (
    <form onSubmit={onNext}>
      <header className={styles.title}>{t('import-hardware.title.detect-device')}</header>
      <section className={styles.main}>
        <div className={styles.model}>{productName}</div>
        {errorMsg ? (
          <>
            <span>{errors[errorType]}</span>
            <span>{t('import-hardware.abort')}</span>
          </>
        ) : null}
        {scaning ? <span>waiting for ckb app...</span> : null}
        {firmwareVersion && !errorMsg && !scaning ? (
          <span>{t('import-hardware.firmware-version', { version: firmwareVersion })}</span>
        ) : null}
        {appVersion ? <span>{t('import-hardware.app-version', { version: appVersion })}</span> : null}
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

export interface Model {
  manufacturer: string
  product: string
}

const supportedHardwareModels = [
  {
    text: 'Ledger Nano S',
    key: '0',
    data: {
      manufacturer: 'Ledger',
      product: 'Nano S',
    },
  },
  {
    text: 'Ledger Nano X',
    key: '1',
    data: {
      manufacturer: 'Ledger',
      product: 'Nano X',
    },
  },
  {
    text: 'Ledger Blue',
    key: '2',
    data: {
      manufacturer: 'Ledger',
      product: 'Blue',
    },
  },
]

const SelectModel = ({ match, history }: RouteComponentProps) => {
  const [t] = useTranslation()
  const [model, setModel] = useState<Model>(supportedHardwareModels[0] as any)

  const onBack = useCallback(() => {
    history.goBack()
  }, [history])

  const onNext = useCallback(() => {
    history.push({
      pathname: match.url + RoutePath.DetectDevice,
      state: model,
    })
  }, [history, match.url, model])

  const onDropDownChange = useCallback((_, { data }) => {
    setModel(data)
  }, [])

  return (
    <form onSubmit={onNext}>
      <header className={styles.title}>{t('import-hardware.title.select-model')}</header>
      <section className={styles.main}>
        <Dropdown onChange={onDropDownChange} placeholder="Select Model" options={supportedHardwareModels} />
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.cancel')} onClick={onBack} />
        <Button
          type="submit"
          label={t('import-hardware.actions.next')}
          onClick={onNext}
          disabled={model === undefined}
        />
      </footer>
    </form>
  )
}

const ImportHardware = ({ match }: RouteComponentProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    dialogRef.current!.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <Switch>
        <Route component={SelectModel} exact path={match.url} />
        <Route component={DetectDevice} exact path={match.url + RoutePath.DetectDevice} />
      </Switch>
    </dialog>
  )
}

ImportHardware.displayName = 'FindDevice'
export default ImportHardware
