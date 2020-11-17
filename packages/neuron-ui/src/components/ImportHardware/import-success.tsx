import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'
import { ReactComponent as CompleteIcon } from 'widgets/Icons/Complete.svg'
import { RoutePath, LocationState } from './common'

import styles from './findDevice.module.scss'

const ImportSuccess = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const { entryPath } = location.state
  const onClose = useCallback(() => {
    history.push(entryPath.replace(RoutePath.ImportHardware, ''))
  }, [history, entryPath])

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span>
          <CompleteIcon />
        </span>
        <div className={styles.message}>{t('import-hardware.actions.success')}</div>
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.close')} onClick={onClose} />
      </footer>
    </div>
  )
}

ImportSuccess.displayName = 'ImportSuccess'

export default ImportSuccess
