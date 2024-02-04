import React, { useCallback } from 'react'
import Dialog from 'widgets/Dialog'
import { useTranslation } from 'react-i18next'
import { shell } from 'electron'
import { invokeShowOpenDialog } from 'services/remote'
import { isSuccessResponse } from 'utils'
import styles from './dataPathDialog.module.scss'

const DataPathDialog = ({
  show,
  confirmText,
  icon,
  text,
  dataPath,
  onChangeDataPath,
  onCancel,
  onConfirm,
}: {
  show: boolean
  confirmText: string
  icon: React.ReactNode
  text: React.ReactNode
  dataPath: string
  onChangeDataPath: (dataPath: string) => void
  onCancel: () => void
  onConfirm: (e: React.FormEvent<Element>) => void
}) => {
  const [t] = useTranslation()
  const openPath = useCallback((e: React.SyntheticEvent<HTMLButtonElement>) => {
    const {
      dataset: { path },
    } = e.currentTarget
    if (path) {
      shell.openPath(path)
    }
  }, [])
  const onSetDataPath = useCallback(() => {
    invokeShowOpenDialog({
      buttonLabel: t('settings.data.set', { lng: navigator.language }),
      properties: ['openDirectory', 'createDirectory', 'promptToCreate', 'treatPackageAsDirectory'],
    }).then(res => {
      if (isSuccessResponse(res) && res.result && !res.result?.canceled && res.result?.filePaths?.length) {
        onChangeDataPath(res.result.filePaths[0])
      }
    })
  }, [])
  return (
    <Dialog
      show={show}
      confirmText={confirmText}
      onCancel={onCancel}
      onConfirm={onConfirm}
      showHeader={false}
      contentClassName={styles.content}
      className={styles.dialog}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
      <div className={styles.desc}>{t('common.ckb-node-data-path')}</div>
      <div className={styles.pathContainer}>
        <button className={styles.path} type="button" onClick={openPath} data-path={dataPath}>
          {dataPath}
        </button>
        <button className={styles.btn} type="button" onClick={onSetDataPath}>
          {t('settings.data.set-path')}
        </button>
      </div>
    </Dialog>
  )
}

DataPathDialog.displayName = 'DataPathDialog'
export default DataPathDialog
