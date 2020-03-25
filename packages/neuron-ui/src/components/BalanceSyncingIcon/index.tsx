import React from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionStatus, SyncStatus } from 'utils/const'
import { ReactComponent as BalanceSyncing } from 'widgets/Icons/BalanceSyncing.svg'
import { ReactComponent as BalanceSyncFailed } from 'widgets/Icons/BalanceSyncFailed.svg'
import styles from './balanceSyncIcon.module.scss'

export interface BalanceSyncIconProps {
  connectionStatus: State.ConnectionStatus
  syncStatus: SyncStatus
}

const BalanceSyncIcon = ({ connectionStatus, syncStatus }: BalanceSyncIconProps) => {
  const [t] = useTranslation()
  if (ConnectionStatus.Offline === connectionStatus) {
    return (
      <div className={styles.container} data-content={t('sync.sync-failed')}>
        <BalanceSyncFailed />
      </div>
    )
  }

  switch (syncStatus) {
    case SyncStatus.SyncNotStart: {
      return (
        <div className={styles.container} data-content={t('sync.sync-not-start')}>
          <BalanceSyncFailed />
        </div>
      )
    }
    case SyncStatus.Syncing:
    case SyncStatus.SyncPending: {
      return (
        <div className={styles.container} data-content={t('sync.syncing-balance')}>
          <BalanceSyncing />
        </div>
      )
    }
    default: {
      return null
    }
  }
}

BalanceSyncIcon.displayName = 'BalanceSyncIcon'
export default BalanceSyncIcon
