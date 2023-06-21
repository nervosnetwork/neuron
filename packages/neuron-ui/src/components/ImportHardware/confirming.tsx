import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ReactComponent as PendingIcon } from 'widgets/Icons/Pending.svg'
import { getDeviceExtendedPublickey } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { ImportStep, ActionType } from './common'

import styles from './findDevice.module.scss'

const Confirming = ({ dispatch }: { dispatch: React.Dispatch<ActionType> }) => {
  const [t] = useTranslation()
  const onBack = useCallback(() => {
    dispatch({ step: ImportStep.ImportHardware })
  }, [dispatch])

  useEffect(() => {
    let cancel = false
    getDeviceExtendedPublickey().then(res => {
      if (cancel) {
        return
      }
      if (isSuccessResponse(res)) {
        dispatch({
          step: ImportStep.NameWallet,
          extendedPublicKey: res.result!,
        })
      } else {
        dispatch({
          step: ImportStep.Error,
          error: res.message,
        })
      }
    })
    return () => {
      cancel = true
    }
  }, [])

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span className={styles.rotating}>
          <PendingIcon />
        </span>
        <div className={styles.message}>{t('import-hardware.actions.confirm')}</div>
      </section>
      <footer className={styles.dialogFooter}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
      </footer>
    </div>
  )
}

Confirming.displayName = 'Confirming'

export default Confirming
