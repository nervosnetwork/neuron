import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import { errorFormatter } from 'utils'
import { ActionType, ImportHardwareState, ImportStep } from './common'

import styles from './findDevice.module.scss'

const ImportError = ({
  dispatch,
  error,
}: {
  dispatch: React.Dispatch<ActionType>
  error: ImportHardwareState['error']
}) => {
  const [t] = useTranslation()
  const onBack = useCallback(() => {
    dispatch({ step: ImportStep.ImportHardware })
  }, [dispatch])

  const errorMsg = error ? errorFormatter(error, t) : ''

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span>
          <FailedInfo />
        </span>
        <div className={styles.message}>
          <CopyZone content={errorMsg}>{errorMsg}</CopyZone>
        </div>
      </section>
      <footer className={styles.dialogFooter}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
      </footer>
    </div>
  )
}

ImportError.displayName = 'ImportError'

export default ImportError
