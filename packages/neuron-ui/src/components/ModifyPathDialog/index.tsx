import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
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
  setNotice,
}: {
  onCancel?: () => void
  prevPath: string
  currentPath: string
  onConfirm: (dataPath: string) => void
  onSetting: (onSuccess?: (path: string) => void) => void
  setNotice: (notice: string) => void
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

  const handleResync = useCallback(async () => {
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
  }, [onSetting, onConfirm, setFailureMessage])

  if (isMigrateOpen) {
    return (
      <MigrateCkbDataDialog
        prevPath={prevPath}
        currentPath={currentPath}
        onCancel={() => setIsMigrateOpen(false)}
        onConfirm={onConfirm}
        onClose={onCancel}
        setNotice={setNotice}
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
        onClose={onCancel}
      >
        <div>
          <div className={styles.tip}>
            <Attention />
            {t('settings.data.modify-path-notice', { needSize })}
          </div>

          <div className={styles.pathItem}>
            <p className={currentPath ? styles.path : ''}>{currentPath || 'path/to/ckb_node_data'}</p>
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
        className={styles.dialog}
        onClose={onCancel}
        confirmText={t('settings.data.retain-previous-data')}
        onConfirm={() => setIsRetainPreviousData(true)}
        confirmProps={{ type: 'dashed' }}
        cancelText={t('settings.data.resync')}
        onCancel={handleResync}
        cancelProps={{ type: 'dashed' }}
      >
        <div>
          <div className={styles.tip}>
            <Attention />
            {t('settings.data.modify-path-notice', { needSize })}
          </div>
          <p className={styles.modifyTip}>{t('settings.data.modify-path-content')}</p>
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
