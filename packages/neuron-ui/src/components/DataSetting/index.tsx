import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import ClearCache from 'components/ClearCache'
import { ReactComponent as AttentionOutline } from 'widgets/Icons/AttentionOutline.svg'
import { useDispatch, useState as useGlobalState } from 'states'
import { shell } from 'electron'
import Spinner from 'widgets/Spinner'
import { getIsCkbRunExternal } from 'services/remote'
import { isSuccessResponse } from 'utils'
import Tooltip from 'widgets/Tooltip'
import Dialog from 'widgets/Dialog'
import { LIGHT_NETWORK_TYPE } from 'utils/const'
import { useDataPath } from './hooks'

import styles from './dataSetting.module.scss'

const PathItem = ({
  path,
  handleClick,
  openPath,
  disabled
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
  const { onSetting, prevPath, currentPath, isDialogOpen, onCancel, onConfirm, isSaving, savingType } = useDataPath()

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
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === LIGHT_NETWORK_TYPE,
    [networkID, networks]
  )
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
          { isLightClient ? null : <PathItem path={prevPath} openPath={openPath} handleClick={onSetting} disabled={isCkbRunExternal} /> }
          <ClearCache className={styles.item} btnClassName={styles.itemBtn} dispatch={dispatch} hideRebuild={isLightClient} />
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
