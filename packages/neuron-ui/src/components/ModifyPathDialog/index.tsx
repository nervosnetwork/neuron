import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import AlertDialog from 'widgets/AlertDialog'
import MigrateCkbDataDialog from 'widgets/MigrateCkbDataDialog'
import { setCkbNodeDataPath, getCkbNodeDataNeedSize } from 'services/remote'
import { Attention } from 'widgets/Icons/icon'
import { isSuccessResponse } from 'utils'
import styles from './modifyPathDialog.module.scss'

const ModifyPathDialog = ({
  prevPath,
  currentPath,
  onCancel,
  onConfirm,
  onSetting,
}: {
  onCancel?: () => void
  prevPath: string
  currentPath: string
  onConfirm: (dataPath: string) => void
  onSetting: (onSuccess?: (path: string) => void) => void
}) => {
  const [t] = useTranslation()
  const [isMigrateOpen, setIsMigrateOpen] = useState(false)
  const [failureMessage, setFailureMessage] = useState('')
  const [isRetainPreviousData, setIsRetainPreviousData] = useState(false)
  const [needSize, setNeedSize] = useState(0)

  useEffect(() => {
    getCkbNodeDataNeedSize().then(res => {
      if (isSuccessResponse(res)) {
        setNeedSize(res.result!)
      }
    })
  }, [])

  const handleResynchronize = useCallback(async () => {
    setFailureMessage('')
    onSetting(path => {
      setCkbNodeDataPath({
        dataPath: path,
        clearCache: true,
      }).then(res => {
        if (isSuccessResponse(res)) {
          onConfirm(path)
        } else {
          setFailureMessage(typeof res.message === 'string' ? res.message : res.message.content!)
        }
      })
    })
  }, [onSetting, onConfirm])

  if (isMigrateOpen) {
    return (
      <MigrateCkbDataDialog
        prevPath={prevPath}
        currentPath={currentPath}
        onCancel={() => setIsMigrateOpen(false)}
        onConfirm={onConfirm}
      />
    )
  }

  if (isRetainPreviousData) {
    return (
      <Dialog
        show
        title={t('settings.data.set-a-new-path')}
        cancelText={t('wizard.back')}
        onCancel={() => setIsRetainPreviousData(false)}
        onConfirm={() => setIsMigrateOpen(true)}
        confirmText={t('wizard.next')}
        className={styles.dialog}
        disabled={!currentPath}
      >
        <div>
          <div className={styles.tip}>
            <Attention />
            {t('settings.data.modify-path-notice', { needSize })}
          </div>

          <div className={styles.pathItem}>
            <p>{currentPath}</p>
            <button type="button" onClick={() => onSetting()}>
              {t('settings.data.browse')}
            </button>
          </div>
        </div>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog
        show={!failureMessage}
        title={t('settings.data.modify-path')}
        showFooter={false}
        onCancel={onCancel}
        className={styles.dialog}
      >
        <div>
          <div className={styles.tip}>
            <Attention />
            {t('settings.data.modify-path-notice', { needSize })}
          </div>
          <p className={styles.modifyTip}>{t('settings.data.modify-path-content')}</p>

          <div className={styles.footer}>
            <Button type="dashed" label={t('settings.data.resynchronize')} onClick={handleResynchronize} />
            <Button
              type="dashed"
              label={t('settings.data.retain-previous-data')}
              onClick={() => setIsRetainPreviousData(true)}
            />
          </div>
        </div>
      </Dialog>
      <AlertDialog
        show={!!failureMessage}
        title={t('settings.data.ckb-node-data')}
        message={failureMessage}
        type="warning"
        action="ok"
        onOk={() => setFailureMessage('')}
      />
    </>
  )
}

ModifyPathDialog.displayName = 'ModifyPathDialog'

export default ModifyPathDialog
