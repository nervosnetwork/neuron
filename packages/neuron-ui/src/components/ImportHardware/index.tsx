import React, { useEffect, useReducer } from 'react'
import { useDialogWrapper } from 'utils'
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
  const { dialogRef, openDialog, closeDialog } = useDialogWrapper()
  useEffect(() => {
    if (!dialogRef) {
      return
    }
    if (
      importHardwareStates.step === ImportStep.ImportHardware ||
      importHardwareStates.step === ImportStep.NameWallet
    ) {
      closeDialog()
    } else {
      openDialog()
    }
  }, [importHardwareStates.step, dialogRef, closeDialog, openDialog])
  switch (importHardwareStates.step) {
    case ImportStep.ImportHardware:
    case ImportStep.DetectDevice:
    case ImportStep.Comfirming:
    case ImportStep.Error:
    case ImportStep.Success:
      return (
        <>
          <SelectModel dispatch={dispatch} />
          <dialog ref={dialogRef} className={styles.dialog}>
            {ImportStep.DetectDevice === importHardwareStates.step && (
              <DetectDevice dispatch={dispatch} model={importHardwareStates.model!} />
            )}
            {ImportStep.Comfirming === importHardwareStates.step && <Comfirming dispatch={dispatch} />}
            {ImportStep.Error === importHardwareStates.step && (
              <ImportError dispatch={dispatch} error={importHardwareStates.error} />
            )}
            {ImportStep.Success === importHardwareStates.step && <ImportSuccess dispatch={dispatch} />}
          </dialog>
        </>
      )
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
  return (
    <div className={styles.importHardwareRoot}>
      <Content />
    </div>
  )
}

ImportHardware.displayName = 'ImportHardware'

export default ImportHardware
