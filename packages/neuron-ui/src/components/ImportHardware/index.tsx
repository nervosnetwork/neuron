import React, { useRef, useEffect, useReducer } from 'react'
import Experimental from 'widgets/ExperimentalRibbon'
import Comfirming from './confirming'
import ImportError from './import-error'
import SelectModel from './select-model'
import DetectDevice from './detect-device'
import ImportSuccess from './import-success'
import NameWallet from './name-wallet'
import { ImportStep, ImportHardwareState, ActionType } from './common'

import styles from './findDevice.module.scss'

const reducer: React.Reducer<ImportHardwareState, ActionType> = (state, action) => {
  return { ...state, ...action }
}

const Content = () => {
  const [importHardwareStates, dispatch] = useReducer(reducer, { step: ImportStep.ImportHardware })
  switch (importHardwareStates.step) {
    case ImportStep.ImportHardware:
      return <SelectModel dispatch={dispatch} />
    case ImportStep.DetectDevice:
      return <DetectDevice dispatch={dispatch} model={importHardwareStates.model!} />
    case ImportStep.Comfirming:
      return <Comfirming dispatch={dispatch} />
    case ImportStep.Error:
      return <ImportError dispatch={dispatch} error={importHardwareStates.error} />
    case ImportStep.Success:
      return <ImportSuccess dispatch={dispatch} />
    case ImportStep.NameWallet:
      return (
        <NameWallet
          dispatch={dispatch}
          model={importHardwareStates.model}
          extendedPublicKey={importHardwareStates.extendedPublicKey}
        />
      )
    default:
      return <SelectModel dispatch={dispatch} />
  }
}

const ImportHardware = () => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const EXPERIMENTAL_TAG = 'import-hardware'

  useEffect(() => {
    dialogRef.current!.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <Experimental tag={EXPERIMENTAL_TAG} showRibbon={false} message="messages.experimental-message-hardware" />
      <Content />
    </dialog>
  )
}

ImportHardware.displayName = 'ImportHardware'

export default ImportHardware
