import React from 'react'
import { useTranslation } from 'react-i18next'

import styles from 'containers/Navbar/navbar.module.scss'
import { SyncStatus as SyncStatusEnum, ConnectionStatus } from 'utils/const'

const SyncStatus = ({
  syncStatus,
  connectionStatus,
}: React.PropsWithoutRef<{
  syncStatus: SyncStatusEnum
  connectionStatus: State.ConnectionStatus
}>) => {
  const [t] = useTranslation()
  if (SyncStatusEnum.FailToFetchTipBlock === syncStatus) {
    return (
      <div className={styles.sync} data-online={connectionStatus === ConnectionStatus.Online}>
        <span>{t('navbar.fail-to-fetch-tip-block-number')}</span>
      </div>
    )
  }

  if (SyncStatusEnum.SyncNotStart === syncStatus) {
    return (
      <div className={styles.sync} data-online={connectionStatus === ConnectionStatus.Online}>
        <span style={{ color: 'red' }}>{t('navbar.sync-not-start')}</span>
      </div>
    )
  }

  if (SyncStatusEnum.SyncPending === syncStatus) {
    return (
      <div className={styles.sync} data-online={connectionStatus === ConnectionStatus.Online}>
        <span style={{ color: '#ED784A' }}>{t('sync.slow')}</span>
      </div>
    )
  }

  if (SyncStatusEnum.SyncCompleted === syncStatus) {
    return (
      <div className={styles.sync} data-online={connectionStatus === ConnectionStatus.Online}>
        <span>{t('sync.synced')}</span>
      </div>
    )
  }

  return (
    <div className={styles.sync} data-online={connectionStatus === ConnectionStatus.Online}>
      <span>{t('sync.syncing')}</span>
    </div>
  )
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
