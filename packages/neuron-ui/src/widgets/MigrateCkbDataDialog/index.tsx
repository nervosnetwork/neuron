import React, { useCallback, useState, useEffect, useRef } from 'react'
import Dialog from 'widgets/Dialog'
import { shell } from 'electron'
import { useTranslation } from 'react-i18next'
import { setCkbNodeDataPath } from 'services/remote'
import { isSuccessResponse } from 'utils'
import Button from 'widgets/Button'
import AlertDialog from 'widgets/AlertDialog'
import styles from './migrateCkbDataDialog.module.scss'

const MigrateCkbDataDialog = ({
  prevPath,
  currentPath,
  onCancel,
  onConfirm,
  onClose,
  setNotice,
}: {
  prevPath: string
  currentPath: string
  onCancel: () => void
  onConfirm: (dataPath: string) => void
  onClose?: () => void
  setNotice?: (notice: string) => void
}) => {
  const [t] = useTranslation()
  const [failureMessage, setFailureMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [seconds, setSeconds] = useState(5)

  const openPath = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const elm = e.target
    if (!(elm instanceof HTMLButtonElement)) return
    const { path } = elm.dataset
    if (!path) return
    shell.openPath(path)
  }

  useEffect(() => {
    if (seconds !== 0) {
      timerRef.current = setTimeout(() => {
        setSeconds(seconds - 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [seconds])

  const handleMigrate = useCallback(() => {
    setFailureMessage('')
    setIsSaving(true)
    setCkbNodeDataPath({
      dataPath: currentPath,
      clearCache: false,
    })
      .then(res => {
        if (isSuccessResponse(res)) {
          onConfirm(currentPath)
          setNotice?.(t('settings.data.migrate-data-successful'))
        } else {
          setFailureMessage(typeof res.message === 'string' ? res.message : res.message.content!)
        }
      })
      .finally(() => {
        setIsSaving(false)
      })
  }, [currentPath, onConfirm, setNotice])

  return (
    <>
      <Dialog
        show={!failureMessage}
        title={t('settings.data.migrate-previous-ckb-node-data')}
        cancelText={t('common.back')}
        confirmText={seconds ? t('settings.data.migrate-confirm', { seconds }) : t('common.confirm')}
        onCancel={onCancel}
        onConfirm={handleMigrate}
        disabled={isSaving || !!seconds}
        onClose={onClose}
      >
        <div className={styles.dialogContainer}>
          <p className={styles.title}>{t('settings.data.migrate-previous-ckb-node-data-notice')}</p>
          <div className={styles.noticeWrap}>
            <div>
              <p>{t('settings.data.migrate-step-1')}</p>
              <Button type="text" onClick={openPath} data-path={prevPath}>
                {t('settings.data.click-here')}
              </Button>
            </div>
            <div>
              <p>{t('settings.data.migrate-step-2')}</p>
              <Button type="text" onClick={openPath} data-path={currentPath}>
                {t('settings.data.click-here')}
              </Button>
            </div>
            <div>
              <p>{t('settings.data.migrate-step-3')}</p>
            </div>
          </div>
        </div>
      </Dialog>
      <AlertDialog
        show={!!failureMessage}
        title={t('settings.data.ckb-node-data')}
        message={failureMessage}
        type="warning"
        onCancel={() => setFailureMessage('')}
        onOk={handleMigrate}
      />
    </>
  )
}

MigrateCkbDataDialog.displayName = 'MigrateCkbDataDialog'
export default MigrateCkbDataDialog
