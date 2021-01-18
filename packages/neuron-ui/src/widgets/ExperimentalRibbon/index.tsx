import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ExperimentalIcon from 'widgets/Icons/Experimental.png'
import Button from 'widgets/Button'
import { useDialog } from 'utils/hooks'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import styles from './experimentalRibbon.module.scss'

const ExperimentalRibbon = ({
  tag,
  showRibbon = true,
  message = 'messages.experimental-message',
}: {
  tag: string
  showRibbon?: boolean
  message?: string
}) => {
  const [t] = useTranslation()
  const [isDialogShow, setIsDialogShow] = useState(false)
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const localStorageKey = `has-experimental-${tag}-shown`

  const onDismiss = () => {
    window.localStorage.setItem(localStorageKey, 'true')
    setIsDialogShow(false)
  }

  useDialog({ show: isDialogShow, dialogRef, onClose: onDismiss })

  useEffect(() => {
    const hasShown = window.localStorage.getItem(localStorageKey)
    if (hasShown !== 'true') {
      setIsDialogShow(true)
    }
  }, [localStorageKey])

  return (
    <div className={styles.container}>
      {showRibbon ? (
        <>
          <img src={ExperimentalIcon} alt="experimental" />
          <span className={styles.text}>{t('common.experimental')}</span>
        </>
      ) : null}
      <dialog ref={dialogRef} className={styles.dialog}>
        <div className={styles.icon}>
          <Attention />
        </div>
        <div className={styles.message}>{t(message)}</div>
        <div className={styles.footer}>
          <Button type="primary" onClick={onDismiss} label={t('common.close')} />
        </div>
      </dialog>
    </div>
  )
}

ExperimentalRibbon.displayName = 'ExperimentalRibbon'

export default ExperimentalRibbon
