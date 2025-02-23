import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ClearCache from 'components/ClearCache'
import { useDispatch, useState as useGlobalState } from 'states'
import { shell } from 'electron'
import Tooltip from 'widgets/Tooltip'
import { NetworkType } from 'utils/const'
import { Attention, More } from 'widgets/Icons/icon'
import ModifyPathDialog from 'components/ModifyPathDialog'
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
      <Tooltip
        className={styles.moreTooltip}
        tipClassName={styles.moreTip}
        tip={
          <div className={styles.actions}>
            {[
              {
                label: 'settings.data.browse-local-files',
                onClick: openPath,
              },
              {
                label: 'settings.data.modify-path',
                onClick: handleClick,
              },
            ].map(({ label, onClick }) => (
              <button type="button" key={label} onClick={onClick}>
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
        }
        trigger="click"
      >
        <button className={styles.itemBtn} type="button" disabled={disabled}>
          <More />
        </button>
      </Tooltip>
    </div>
  )
}

const DataSetting = () => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const {
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const network = useMemo(() => networks.find(n => n.id === networkID), [networkID, networks])
  const { isDialogOpen, openDialog, onSetting, prevPath, currentPath, onCancel, onConfirm } = useDataPath(network)

  const openPath = useCallback(() => {
    if (prevPath) {
      shell.openPath(prevPath!)
    }
  }, [prevPath])
  const isLightClient = network?.type === NetworkType.Light
  const hiddenDataPath = isLightClient || !network?.readonly

  return (
    <>
      <div className={styles.root}>
        <div className={styles.leftContainer}>
          {hiddenDataPath ? null : (
            <div className={styles.label}>
              <div>{t('settings.data.ckb-node-data')}</div>
              <Tooltip
                placement="top"
                tip={<p className={styles.tooltip}>{t('settings.data.disabled-set-path')}</p>}
                showTriangle
                className={styles.tip}
              >
                <Attention />
              </Tooltip>
            </div>
          )}
          <div className={styles.label}>
            <div>{t('settings.data.cache')}</div>
            <Tooltip
              placement="top"
              tip={<p className={styles.tooltip}>{t('settings.data.clear-cache-description')}</p>}
              showTriangle
              className={styles.tip}
            >
              <Attention />
            </Tooltip>
          </div>
        </div>
        <div className={styles.rightContainer}>
          {hiddenDataPath ? null : <PathItem path={prevPath} openPath={openPath} handleClick={openDialog} />}
          <ClearCache className={styles.item} btnClassName={styles.itemBtn} dispatch={dispatch} />
        </div>
      </div>

      {isDialogOpen && (
        <ModifyPathDialog
          prevPath={prevPath}
          currentPath={currentPath}
          onCancel={onCancel}
          onConfirm={onConfirm}
          onSetting={onSetting}
        />
      )}
    </>
  )
}

DataSetting.displayName = 'DataSetting'
export default DataSetting
