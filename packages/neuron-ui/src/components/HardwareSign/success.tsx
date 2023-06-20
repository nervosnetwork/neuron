import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { RoutePath } from 'utils'
import Button from 'widgets/Button'
import { ReactComponent as CompleteIcon } from 'widgets/Icons/Complete.svg'

import styles from './hardwareSign.module.scss'

const SignSuccess = ({ onCancel }: { onCancel: () => void }) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const onClose = useCallback(() => {
    onCancel()
    navigate(RoutePath.History)
  }, [navigate, onCancel])

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

SignSuccess.displayName = 'SignSuccess'

export default SignSuccess
