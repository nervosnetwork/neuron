import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncStatus as SyncStatusEnum, ConnectionStatus } from 'utils'
import { Confirming, NewTab } from 'widgets/Icons/icon'
import { ReactComponent as UnexpandStatus } from 'widgets/Icons/UnexpandStatus.svg'
import Tooltip from 'widgets/Tooltip'
import styles from './syncStatus.module.scss'

const SyncDetail = ({
  syncBlockNumbers,
  isLookingValidTarget,
  onOpenValidTarget,
}: {
  syncBlockNumbers: string
  isLookingValidTarget: boolean
  onOpenValidTarget: (e: React.SyntheticEvent) => void
}) => {
  const [t] = useTranslation()
  return (
    <>
      <div className={styles.blockSynced}>
        {t('network-status.tooltip.block-synced')}:
        <br />
        <span className={styles.blockNumber}>{syncBlockNumbers}</span>
      </div>
      {isLookingValidTarget && (
        <div
          role="link"
          className={styles.lookingValidTarget}
          onClick={onOpenValidTarget}
          onKeyPress={onOpenValidTarget}
          tabIndex={-1}
        >
          <div>
            <span>{t('network-status.tooltip.looking-valid-target')}</span>
            <NewTab />
          </div>
        </div>
      )}
    </>
  )
}

const SyncStatus = ({
  syncStatus,
  connectionStatus,
  syncPercents,
  syncBlockNumbers,
  isLookingValidTarget,
  onOpenValidTarget,
  isMigrate,
}: React.PropsWithoutRef<{
  syncStatus: SyncStatusEnum
  connectionStatus: State.ConnectionStatus
  syncPercents: string
  syncBlockNumbers: string
  isLookingValidTarget: boolean
  onOpenValidTarget: (e: React.SyntheticEvent) => void
  isMigrate: boolean
}>) => {
  const [t] = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const onChangeIsOpen = useCallback(() => {
    setIsOpen(v => !v)
  }, [setIsOpen])

  if (isMigrate) {
    return <span>{t('network-status.migrating')}</span>
  }

  if (ConnectionStatus.Connecting === connectionStatus) {
    return <span>{t('navbar.connecting')}</span>
  }

  if (ConnectionStatus.Offline === connectionStatus) {
    return <span style={{ color: '#FF1E1E' }}>{t('sync.sync-failed')}</span>
  }

  if (SyncStatusEnum.SyncNotStart === syncStatus) {
    return <span style={{ color: '#FF1E1E' }}>{t('navbar.sync-not-start')}</span>
  }

  if (SyncStatusEnum.SyncPending === syncStatus) {
    return <span style={{ color: '#f7ae4d' }}>{t('sync.slow')}</span>
  }

  return (
    <Tooltip
      tip={
        <SyncDetail
          syncBlockNumbers={syncBlockNumbers}
          isLookingValidTarget={isLookingValidTarget}
          onOpenValidTarget={onOpenValidTarget}
        />
      }
      trigger="click"
      className={styles.tipContainer}
      tipClassName={styles.tip}
      showTriangle
    >
      {SyncStatusEnum.SyncCompleted === syncStatus ? (
        <button className={styles.synced} onClick={onChangeIsOpen} type="button">
          {t('sync.synced')}
          <UnexpandStatus className={styles.expand} data-is-open={isOpen} />
        </button>
      ) : (
        <button onClick={onChangeIsOpen} className={styles.syncing} type="button">
          <Confirming className={styles.confirm} />
          {t('sync.syncing', { syncPercents })}
          <UnexpandStatus className={styles.expand} data-is-open={isOpen} />
        </button>
      )}
    </Tooltip>
  )
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
