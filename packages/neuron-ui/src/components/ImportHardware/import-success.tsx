import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ReactComponent as CompleteIcon } from 'widgets/Icons/Complete.svg'
import { ImportStep, ActionType } from './common'

import styles from './findDevice.module.scss'

const ImportSuccess = ({ dispatch }: { dispatch: React.Dispatch<ActionType> }) => {
  const [t] = useTranslation()
  const onClose = useCallback(() => {
    dispatch({ step: ImportStep.ImportHardware })
  }, [])

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span>
          <CompleteIcon />
        </span>
        <div className={styles.message}>{t('import-hardware.actions.success')}</div>
      </section>
      <footer className={styles.dialogFooter}>
        <Button type="cancel" label={t('import-hardware.actions.close')} onClick={onClose} />
      </footer>
    </div>
  )
}

ImportSuccess.displayName = 'ImportSuccess'

export default ImportSuccess
