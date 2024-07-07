import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import SplitPasswordInput from 'widgets/SplitPasswordInput'
import Alert from 'widgets/Alert'
import Button from 'widgets/Button'
import { passwordLength, useOldPassword, usePassword, useRepeatPassword } from './hooks'
import styles from './lockWindowDialog.module.scss'

const LockWindowDialog = ({
  show,
  onCancel,
  encryptedPassword,
}: {
  show: boolean
  onCancel: (success?: boolean) => void
  encryptedPassword?: string
}) => {
  const [t] = useTranslation()
  const { oldPasswordErr, verifySuccess, oldPassword, onUpdateOldPassword, resetOldPassword } = useOldPassword({ t })
  const { password, onUpdatePassword, resetPassword } = usePassword()
  const joinedPassword = useMemo(() => password.join(''), [password])
  const { errMsg, repeatPassword, onUpdateRepeatPassword, resetRepeatPassword, isSuccess } = useRepeatPassword({
    t,
    password: joinedPassword,
    encryptedPassword,
    onCancel,
  })
  useEffect(() => {
    // when dialog open, reset all status
    if (show) {
      resetOldPassword()
      resetPassword()
      resetRepeatPassword()
    }
  }, [show, resetOldPassword, resetPassword, resetRepeatPassword])
  const onReset = useCallback(() => {
    resetPassword()
    resetRepeatPassword()
  }, [resetPassword, resetRepeatPassword])
  const content = () => {
    if (encryptedPassword && !verifySuccess) {
      // is verify old password
      return (
        <>
          <span className={styles.secTitle}>{t('settings.general.lock-window.enter-current-password')}</span>
          <div className={styles.password}>
            <SplitPasswordInput values={oldPassword} onChange={onUpdateOldPassword} />
            <div className={styles.err}>{oldPasswordErr}</div>
          </div>
        </>
      )
    }
    if (joinedPassword.length !== passwordLength) {
      // enter password
      return (
        <>
          <span className={styles.secTitle}>{t(`settings.general.lock-window.set-password`)}</span>
          <div className={styles.password}>
            <SplitPasswordInput values={password} onChange={onUpdatePassword} />
          </div>
        </>
      )
    }
    // is verify repeat password
    return (
      <>
        <span className={styles.secTitle}>{t(`settings.general.lock-window.confirm-password`)}</span>
        <div className={styles.password}>
          <SplitPasswordInput values={repeatPassword} onChange={onUpdateRepeatPassword} />
          <div className={styles.err}>{errMsg}</div>
          {errMsg ? (
            <Button type="primary" onClick={onReset}>
              {t('settings.general.lock-window.reset')}
            </Button>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <>
      <Dialog
        show={show}
        title={t(`settings.general.${encryptedPassword ? 'change-lock-password' : 'set-lock-password'}`)}
        onCancel={onCancel}
        showFooter={false}
        className={styles.dialog}
      >
        <div className={styles.content}>{content()}</div>
      </Dialog>
      {isSuccess ? (
        <Alert status="success" className={styles.notice}>
          {t(`settings.general.lock-window.${encryptedPassword ? 'change-password-success' : 'set-password-success'}`)}
        </Alert>
      ) : null}
    </>
  )
}

LockWindowDialog.displayName = 'LockWindowDialog'
export default LockWindowDialog
