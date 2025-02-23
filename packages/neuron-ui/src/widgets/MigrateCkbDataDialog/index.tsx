import React, { useCallback, useState, useEffect, useRef } from 'react'
import { showPageNotice, useDispatch } from 'states'
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
}: {
  prevPath: string
  currentPath: string
  onCancel: () => void
  onConfirm: (dataPath: string) => void
}) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const [failureMessage, setFailureMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [seconds, setSeconds] = useState(5)

  const openPath = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const btn = (e.target as HTMLButtonElement)?.closest('button')
    if (btn?.dataset?.path) {
      shell.openPath(btn?.dataset?.path)
    }
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
          showPageNotice(t('settings.data.migrate-data-successful'))(dispatch)
          onConfirm(currentPath)
        } else {
          setFailureMessage(typeof res.message === 'string' ? res.message : res.message.content!)
        }
      })
      .finally(() => {
        setIsSaving(false)
      })
  }, [currentPath, onConfirm, dispatch])

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
