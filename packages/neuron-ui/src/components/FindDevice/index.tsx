import React, { useRef, useEffect, useCallback } from 'react'
import { Switch, Route, useHistory, RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'

import styles from './findDevice.module.scss'

enum RoutePath {
  DetectDevice = '/detect-device',
  Comfirming = '/confirming',
  Error = '/error',
  Success = '/success',
  NameWallet = '/name-wallet',
}

const DetectDevice = () => {
  const histroy = useHistory()
  const onBack = useCallback(() => {
    histroy.goBack()
  }, [histroy])

  return (
    <div>
      <h2>DetectDevice</h2>
      <Button label="back" onClick={onBack}>
        Back
      </Button>
    </div>
  )
}

const SelectModel = ({ match, history }: RouteComponentProps) => {
  return (
    <form onSubmit={() => {}}>
      <h2>Fuck you</h2>
      <Button label="next" onClick={() => history.push(match.url + RoutePath.DetectDevice)}>
        next
      </Button>
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
