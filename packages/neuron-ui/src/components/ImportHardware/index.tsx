import React, { useRef, useEffect } from 'react'
import { Switch, Route, RouteComponentProps } from 'react-router-dom'
import Comfirming from './confirming'
import ImportError from './import-error'
import SelectModel from './select-model'
import DetectDevice from './detect-device'
import ImportSuccess from './import-success'
import NameWallet from './name-wallet'
import { RoutePath } from './common'

import styles from './findDevice.module.scss'

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
        <Route component={Comfirming} exact path={match.url + RoutePath.Comfirming} />
        <Route component={ImportError} exact path={match.url + RoutePath.Error} />
        <Route component={ImportSuccess} exact path={match.url + RoutePath.Success} />
        <Route component={NameWallet} exact path={match.url + RoutePath.NameWallet} />
      </Switch>
    </dialog>
  )
}

ImportHardware.displayName = 'ImportHardware'

export default ImportHardware
