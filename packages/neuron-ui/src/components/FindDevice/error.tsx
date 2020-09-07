import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import { LocationState } from './common'

import styles from './findDevice.module.scss'

function formatError(error: string | Error) {
  if (typeof error === 'string') {
    return error
  }

  return error.message
}

const ImportError = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const { error, entryPath } = location.state
  const onBack = useCallback(() => {
    history.push(entryPath)
  }, [history, entryPath])

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span>
          <FailedInfo />
        </span>
        <div className={styles.message}>{formatError(error!)}</div>
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
      </footer>
    </div>
  )
}

export default ImportError
