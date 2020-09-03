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

const DetectDevice = ({ match, history }: RouteComponentProps<Model>) => {
  const [t] = useTranslation()
  const histroy = useHistory()
  const model = match.params
  const onBack = useCallback(() => {
    histroy.goBack()
  }, [histroy])

  const [scaning, setScaning] = useState(true)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')

  const findDevice = async () => {
    setScaning(true)
    const res = await getDevices(model)
    if (isSuccessResponse(res)) {
      const [device, ...rest] = res.result!
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
  }

  useEffect(() => {
    findDevice()
  }, [])

  const onNext = useCallback(() => {
    history.push(match.url + RoutePath.Comfirming)
  }, [history, match.url])

  const errors = {
    [ErrorType.CkbAppNotFound]: '',
    [ErrorType.DeviceNotFound]: '',
    [ErrorType.MultiDevice]: '',
  }

  return (
    <form onSubmit={onNext}>
      <header className={styles.title}>Detecting device</header>
      <section className={styles.main}>
        <div className={styles.model}>{model}</div>
        {errorType !== null && <span>{errors[errorType]}</span>}
        {scaning && <span>waiting for ckb app...</span>}
        {appVersion && <span>{t('import-hardware.app-version', { version: appVersion })}</span>}
        {firmwareVersion && <span>{t('import-hardware.app-version', { version: firmwareVersion })}</span>}
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('s-udt.create-dialog.back')} onClick={onBack} />
        <Button type="submit" label={t('s-udt.create-dialog.confirm')} onClick={onNext} />
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
  const [model, setModel] = useState<Model>()

  const onBack = useCallback(() => {
    history.goBack()
  }, [history])

  const onNext = useCallback(() => {
    history.push(match.url + RoutePath.DetectDevice, model)
  }, [history, match.url])

  const onDropDownChange = useCallback((_, { data }) => {
    setModel(data)
  }, [])

  return (
    <form onSubmit={onNext}>
      <header className={styles.title}>Please connect your device and select the model</header>
      <section className={styles.main}>
        <Dropdown onChanged={onDropDownChange} placeholder="Select Model" options={supportedHardwareModels} />
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('s-udt.create-dialog.back')} onClick={onBack} />
        <Button type="submit" label={t('s-udt.create-dialog.confirm')} onClick={onNext} disabled={!!model} />
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
