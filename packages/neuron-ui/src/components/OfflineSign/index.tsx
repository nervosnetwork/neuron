import React, { useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps } from 'react-router-dom'
import { useDidMount } from 'utils'
import Button from 'widgets/Button'
import { useState as useGlobalState } from 'states'
import styles from './offlineSign.module.scss'

const OfflineSign = ({ history }: RouteComponentProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const {
    app: { loadedTransaction },
  } = useGlobalState()
  const [t] = useTranslation()
  const json = useMemo(() => {
    return JSON.stringify(loadedTransaction, null, 2)
  }, [loadedTransaction])

  const onBack = useCallback(() => {
    history.goBack()
  }, [history])

  const onSign = useCallback((e: React.FormEvent) => {
    e.preventDefault()
  }, [])

  useDidMount(() => {
    dialogRef.current!.showModal()
  })

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form className={styles.container}>
        <header className={styles.title}>{t('import-hardware.title.select-model')}</header>
        <section className={styles.main}>
          <textarea disabled value={json} className={styles.textarea} />
        </section>
        <footer className={styles.footer}>
          <Button type="cancel" label={t('import-hardware.actions.cancel')} onClick={onBack} />
          <Button type="submit" label={t('import-hardware.actions.next')} onClick={onSign} />
        </footer>
      </form>
    </dialog>
  )
}

OfflineSign.displayName = 'OfflineSign'

export default OfflineSign
