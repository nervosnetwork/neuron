import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import ClearCache from 'components/ClearCache'
import { useDispatch } from 'states'
import { getCkbNodeDataPath, getIndexerDataPath, setCkbNodeDataPath, setIndexerDataPath } from 'services/remote'
import { ReactComponent as Attention } from 'widgets/Icons/ExperimentalAttention.svg'
import CopyZone from 'widgets/CopyZone'
import { OpenFolder } from 'widgets/Icons/icon'
import { shell } from 'electron'
import { useDataPath } from './hooks'

import styles from './index.module.scss'

const itemProps: Record<
  'ckbNode' | 'indexer',
  {
    type: 'ckb' | 'ckb-indexer'
    getPath: typeof getCkbNodeDataPath | typeof getIndexerDataPath
    setPath: typeof setCkbNodeDataPath | typeof setIndexerDataPath
    titleI18nKey: string
    tipI18nKey: string
  }
> = {
  ckbNode: {
    type: 'ckb',
    getPath: getCkbNodeDataPath,
    setPath: setCkbNodeDataPath,
    titleI18nKey: 'ckb-node-data',
    tipI18nKey: 'remove-ckb-data-tip',
  },
  indexer: {
    type: 'ckb-indexer',
    getPath: getIndexerDataPath,
    setPath: setIndexerDataPath,
    titleI18nKey: 'ckb-indexer-data',
    tipI18nKey: 'remove-indexer-data-tip',
  },
}

const SetItem = ({ type }: { type: keyof typeof itemProps }) => {
  const props = itemProps[type]
  const [t] = useTranslation()
  const { onSetting, prevPath, currentPath, dialogRef, onCancel, onConfirm } = useDataPath(
    props.getPath,
    props.setPath,
    props.type
  )
  const openPath = useCallback(() => {
    if (prevPath) {
      shell.openPath(prevPath!)
    }
  }, [prevPath])
  return (
    <>
      <div className={styles.name}>{t(`settings.data.${props.titleI18nKey}`)}:</div>
      <div className={styles.path}>
        <CopyZone content={prevPath || ''} className={styles.content}>
          {prevPath}
        </CopyZone>
        <OpenFolder onClick={openPath} />
      </div>
      <Button label={t('settings.data.set')} onClick={onSetting} />
      <dialog ref={dialogRef} className={styles.dialog}>
        <div className={styles.describe}>{t(`settings.data.${props.tipI18nKey}`, { prevPath, currentPath })}</div>
        <div className={styles.attention}>
          <Attention />
          {t('settings.data.resync-describe')}
        </div>
        <div className={styles.action}>
          <Button label={t('settings.data.cancel')} type="cancel" onClick={onCancel} />
          <Button label={t('settings.data.move-data-finish')} type="primary" onClick={onConfirm} />
          <Button label={t('settings.data.re-sync')} type="primary" onClick={onConfirm} />
        </div>
      </dialog>
    </>
  )
}

const DataSetting = () => {
  const dispatch = useDispatch()
  return (
    <div className={styles.root}>
      <SetItem type="ckbNode" />
      <SetItem type="indexer" />
      <ClearCache dispatch={dispatch} />
    </div>
  )
}

DataSetting.displayName = 'DataSetting'
export default DataSetting
