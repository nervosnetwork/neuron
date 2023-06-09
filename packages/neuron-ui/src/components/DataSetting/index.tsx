import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import ClearCache from 'components/ClearCache'
import { useDispatch } from 'states'
import { ReactComponent as AttentionOutline } from 'widgets/Icons/AttentionOutline.svg'
import { shell } from 'electron'
import { getIsCkbRunExternal } from 'services/remote'
import { isSuccessResponse } from 'utils'
import Tooltip from 'widgets/Tooltip'
import Dialog from 'widgets/Dialog'
import AlertDialog from 'widgets/AlertDialog'
import { useDataPath } from './hooks'

import styles from './dataSetting.module.scss'

const PathItem = ({
  path,
  handleClick,
  openPath,
  disabled,
}: {
  path?: string
  handleClick: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  openPath: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  disabled?: boolean
}) => {
  const [t] = useTranslation()
  return (
    <div className={`${styles.item} ${styles.pathItem}`}>
      <button className={styles.itemPath} type="button" onClick={openPath}>
        {path}
      </button>
      <button className={styles.itemBtn} type="button" onClick={handleClick} disabled={disabled}>
        {t('settings.data.set-path')}
      </button>
    </div>
  )
}

const DataSetting = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const {
    onSetting,
    prevPath,
    currentPath,
    isDialogOpen,
    onCancel,
    onConfirm,
    isSaving,
    savingType,
    faidMessage,
    setFaidMessage,
  } = useDataPath()

  const resyncRef = useRef<HTMLButtonElement | null>(null)

  const openPath = useCallback(() => {
    if (prevPath) {
      shell.openPath(prevPath!)
    }
  }, [prevPath])
  const [isCkbRunExternal, setIsCkbRunExternal] = useState<boolean | undefined>()
  useEffect(() => {
    getIsCkbRunExternal().then(res => {
      if (isSuccessResponse(res)) {
        setIsCkbRunExternal(res.result ?? false)
      } else {
        // ignore
      }
    })
  }, [])
  return (
    <>
      <div className={styles.root}>
        <div className={styles.leftContainer}>
          <div className={styles.label}>
            <div>{t('settings.data.ckb-node-data')}</div>
            <Tooltip
              placement="top"
              tip={<p className={styles.tooltip}>{t('settings.data.disabled-set-path')}</p>}
              showTriangle
            >
              <AttentionOutline />
            </Tooltip>
          </div>
          <div className={styles.label}>
            <div>{t('settings.data.cache')}</div>
            <Tooltip
              placement="top"
              tip={<p className={styles.tooltip}>{t('settings.data.clear-cache-description')}</p>}
              showTriangle
            >
              <AttentionOutline />
            </Tooltip>
          </div>
        </div>
        <div className={styles.rightContainer}>
          <PathItem path={prevPath} openPath={openPath} handleClick={onSetting} disabled={isCkbRunExternal} />
          <ClearCache className={styles.item} btnClassName={styles.itemBtn} dispatch={dispatch} />
        </div>
      </div>

      <Dialog show={isDialogOpen} title={t('settings.data.ckb-node-storage')} onCancel={onCancel} showFooter={false}>
        <div className={styles.dialogContainer}>
          <div>{t('settings.data.remove-ckb-data-tip', { prevPath, currentPath })}</div>
          <div className={styles.attention}>
            <AttentionOutline />
            {t('settings.data.resync-ckb-node-describe')}
          </div>

          <div className={styles.footer}>
            <Button
              ref={resyncRef}
              disabled={isSaving}
              className={styles.footerBtn}
              data-sync-type="resync"
              data-resync="true"
              label={t('settings.data.re-sync')}
              type="primary"
              onClick={onConfirm}
              loading={isSaving && savingType === 'resync'}
            />

            <Button
              disabled={isSaving}
              className={styles.footerBtn}
              data-sync-type="move"
              label={t('settings.data.move-data-finish')}
              type="primary"
              onClick={onConfirm}
              loading={isSaving && savingType === 'move'}
            />
          </div>
        </div>
      </Dialog>

      <AlertDialog
        show={!!faidMessage}
        title={t('settings.data.ckb-node-data')}
        message={faidMessage}
        type="warning"
        onCancel={() => setFaidMessage('')}
        onOk={() => {
          resyncRef?.current?.click()
        }}
      />
    </>
  )
}

DataSetting.displayName = 'DataSetting'
export default DataSetting
