import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import { errorFormatter } from 'utils'
import { LocationState } from './common'

import styles from './findDevice.module.scss'

const ImportError = ({ history, location }: RouteComponentProps<{}, {}, LocationState>) => {
  const [t] = useTranslation()
  const { error, entryPath } = location.state
  const onBack = useCallback(() => {
    history.push(entryPath)
  }, [history, entryPath])

  const errorMsg = errorFormatter(error!, t)

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
      <footer className={styles.footer}>
        <Button type="cancel" label={t('import-hardware.actions.back')} onClick={onBack} />
      </footer>
    </div>
  )
}

export default ImportError
