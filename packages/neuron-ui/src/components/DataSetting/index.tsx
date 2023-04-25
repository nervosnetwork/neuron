import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import ClearCache from 'components/ClearCache'
import { useDispatch } from 'states'
import { ReactComponent as AttentionOutline } from 'widgets/Icons/AttentionOutline.svg'
import { shell } from 'electron'
import Spinner from 'widgets/Spinner'
import Tooltip from 'widgets/Tooltip'
import Dialog from 'widgets/Dialog'
import { useDataPath } from './hooks'

import styles from './dataSetting.module.scss'

const PathItem = ({
  path,
  handleClick,
  openPath,
}: {
  path?: string
  handleClick: (e: React.SyntheticEvent<HTMLButtonElement>) => void
  openPath: (e: React.SyntheticEvent<HTMLButtonElement>) => void
}) => {
  const [t] = useTranslation()
  return (
    <div className={`${styles.item} ${styles.pathItem}`}>
      <button className={styles.itemPath} type="button" onClick={openPath}>
        {path}
      </button>
      <button className={styles.itemBtn} type="button" onClick={handleClick}>
        {t('settings.data.set-path')}
      </button>
    </div>
  )
}

const DataSetting = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const { onSetting, prevPath, currentPath, isDialogOpen, onCancel, onConfirm, isSaving, savingType } = useDataPath()

  const openPath = useCallback(() => {
    if (prevPath) {
      shell.openPath(prevPath!)
    }
  }, [prevPath])
  return (
    <>
      <div className={styles.root}>
        <div className={styles.leftContainer}>
          <div className={styles.label}>
            <div>{t('settings.data.ckb-node-data')}</div>
            <Tooltip tip={<p className={styles.tooltip}>{t('settings.data.disabled-set-path')}</p>} showTriangle>
              <AttentionOutline />
            </Tooltip>
          </div>
          <div className={styles.label}>
            <div>{t('settings.data.cache')}</div>
            <Tooltip tip={<p className={styles.tooltip}>{t('settings.data.clear-cache-description')}</p>} showTriangle>
              <AttentionOutline />
            </Tooltip>
          </div>
        </div>
        <div className={styles.rightContainer}>
          <PathItem path={prevPath} openPath={openPath} handleClick={onSetting} />
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
              disabled={isSaving}
              className={styles.footerBtn}
              data-sync-type="resync"
              data-resync="true"
              label={t('settings.data.re-sync')}
              type="primary"
              onClick={onConfirm}
            >
              {isSaving && savingType === 'resync' ? (
                <Spinner label={t('settings.data.re-sync')} labelPosition="right" />
              ) : (
                t('settings.data.re-sync')
              )}
            </Button>

            <Button
              disabled={isSaving}
              className={styles.footerBtn}
              data-sync-type="move"
              label={t('settings.data.move-data-finish')}
              type="primary"
              onClick={onConfirm}
            >
              {isSaving && savingType === 'move' ? (
                <Spinner label={t('settings.data.move-data-finish')} labelPosition="right" />
              ) : (
                t('settings.data.move-data-finish')
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

DataSetting.displayName = 'DataSetting'
export default DataSetting
