import React, { useCallback, useRef, useState } from 'react'
import Dialog from 'widgets/Dialog'
import { useTranslation } from 'react-i18next'
import { setCkbNodeDataPath } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { Attention } from 'widgets/Icons/icon'
import Button from 'widgets/Button'
import AlertDialog from 'widgets/AlertDialog'
import styles from './migrateCkbDataDialog.module.scss'

const MigrateCkbDataDialog = ({
  show,
  prevPath,
  currentPath,
  onCancel,
  onConfirm,
}: {
  show: boolean
  prevPath: string
  currentPath: string
  onCancel: () => void
  onConfirm: (dataPath: string) => void
}) => {
  const [t] = useTranslation()
  const resyncRef = useRef<HTMLButtonElement | null>(null)
  const [failureMessage, setFailureMessage] = useState('')
  const [savingType, setSavingType] = useState<string | undefined>()
  const startSync = useCallback(
    (syncType: string) => {
      setFailureMessage('')
      setSavingType(syncType)
      setCkbNodeDataPath({
        dataPath: currentPath,
        clearCache: syncType === 'resync',
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            onConfirm(currentPath)
          } else {
            setFailureMessage(typeof res.message === 'string' ? res.message : res.message.content!)
          }
        })
        .finally(() => {
          setSavingType(undefined)
        })
    },
    [currentPath, onConfirm]
  )
  const onActionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.currentTarget.dataset.syncType) {
        startSync(e.currentTarget.dataset.syncType)
      }
    },
    [startSync]
  )
  return (
    <>
      <Dialog show={show} title={t('settings.data.ckb-node-storage')} onCancel={onCancel} showFooter={false}>
        <div className={styles.dialogContainer}>
          <div>{t('settings.data.remove-ckb-data-tip', { prevPath, currentPath })}</div>
          <div className={styles.attention}>
            <Attention />
            {t('settings.data.resync-ckb-node-describe')}
          </div>

          <div className={styles.footer}>
            <Button
              ref={resyncRef}
              disabled={!!savingType}
              className={styles.footerBtn}
              data-sync-type="resync"
              label={t('settings.data.re-sync')}
              type="primary"
              onClick={onActionClick}
              loading={savingType === 'resync'}
            />

            <Button
              disabled={!!savingType}
              className={styles.footerBtn}
              data-sync-type="move"
              label={t('settings.data.move-data-finish')}
              type="primary"
              onClick={onActionClick}
              loading={savingType === 'move'}
            />
          </div>
        </div>
      </Dialog>
      <AlertDialog
        show={!!failureMessage}
        title={t('settings.data.ckb-node-data')}
        message={failureMessage}
        type="warning"
        onCancel={() => setFailureMessage('')}
        onOk={() => {
          startSync('resync')
        }}
      />
    </>
  )
}

MigrateCkbDataDialog.displayName = 'MigrateCkbDataDialog'
export default MigrateCkbDataDialog
