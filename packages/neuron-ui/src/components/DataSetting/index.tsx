import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import ClearCache from 'components/ClearCache'
import { useDispatch, useState as useGlobalState } from 'states'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import CopyZone from 'widgets/CopyZone'
import { OpenFolder, InfoCircleOutlined } from 'widgets/Icons/icon'
import { shell } from 'electron'
import Spinner from 'widgets/Spinner'
import { BUNDLED_LIGHT_CKB_URL } from 'utils/const'
import { useDataPath } from './hooks'

import styles from './index.module.scss'

const SetItem = () => {
  const [t] = useTranslation()
  const { onSetting, prevPath, currentPath, dialogRef, onCancel, onConfirm, isSaving, savingType } = useDataPath()
  const openPath = useCallback(() => {
    if (prevPath) {
      shell.openPath(prevPath!)
    }
  }, [prevPath])
  return (
    <>
      <div className={styles.name}>
        {t('settings.data.ckb-node-data')}
        <span className={styles.infoIconContainer} data-tip={t('settings.data.disabled-set-path')}>
          <InfoCircleOutlined />
        </span>
        :
      </div>
      <div className={styles.path}>
        <CopyZone content={prevPath || ''} className={styles.content}>
          {prevPath}
        </CopyZone>
        <OpenFolder onClick={openPath} />
      </div>
      <Button label={t('settings.data.set')} onClick={onSetting} />
      <dialog ref={dialogRef} className={styles.dialog}>
        <div className={styles.describe}>{t('settings.data.remove-ckb-data-tip', { prevPath, currentPath })}</div>
        <div className={styles.attention}>
          <Attention />
          {t('settings.data.resync-ckb-node-describe')}
        </div>
        <div className={styles.action}>
          <Button disabled={isSaving} label={t('settings.data.cancel')} type="cancel" onClick={onCancel} />
          <Button
            disabled={isSaving}
            data-sync-type="move"
            label={t('settings.data.move-data-finish')}
            type="primary"
            onClick={onConfirm}
          >
            {isSaving && savingType === 'move' ? (
              <Spinner
                label={t('settings.data.move-data-finish')}
                labelPosition="right"
                styles={{ root: { marginRight: 5 }, label: { color: '#FFF' } }}
              />
            ) : (
              (t('settings.data.move-data-finish') as string)
            )}
          </Button>
          <Button
            disabled={isSaving}
            data-sync-type="resync"
            data-resync="true"
            label={t('settings.data.re-sync')}
            type="primary"
            onClick={onConfirm}
          >
            {isSaving && savingType === 'resync' ? (
              <Spinner
                label={t('settings.data.re-sync')}
                labelPosition="right"
                styles={{ root: { marginRight: 5 }, label: { color: '#FFF' } }}
              />
            ) : (
              (t('settings.data.re-sync') as string)
            )}
          </Button>
        </div>
      </dialog>
    </>
  )
}

const DataSetting = () => {
  const dispatch = useDispatch()
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const isLightClient = useMemo(() => networks.find(n => n.id === networkID)?.remote === BUNDLED_LIGHT_CKB_URL, [
    networkID,
    networks,
  ])
  return (
    <div className={styles.root}>
      {isLightClient ? null : <SetItem />}
      <ClearCache dispatch={dispatch} hideRebuild={isLightClient} />
    </div>
  )
}

DataSetting.displayName = 'DataSetting'
export default DataSetting
