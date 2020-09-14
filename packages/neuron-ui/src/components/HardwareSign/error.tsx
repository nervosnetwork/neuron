import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ReactComponent as FailedInfo } from 'widgets/Icons/FailedInfo.svg'
import { FailureFromController } from 'services/remote/remoteApiWrapper'

import styles from './hardwareSign.module.scss'

function formatError(error: string | FailureFromController['message']) {
  if (typeof error === 'string') {
    return error
  }

  return error.content ?? ''
}

const SignError = ({ error, onCancel }: { error: string; onCancel: () => void }) => {
  const [t] = useTranslation()

  return (
    <div className={styles.container}>
      <section className={styles.action}>
        <span>
          <FailedInfo />
        </span>
        <div className={styles.message}>{formatError(error!)}</div>
      </section>
      <footer className={styles.footer}>
        <Button type="cancel" label={t('hardware-sign.actions.close')} onClick={onCancel} />
      </footer>
    </div>
  )
}

export default SignError
