import React from 'react'
import { useTranslation } from 'react-i18next'
import { SyncStatus as SyncStatusEnum, ConnectionStatus } from 'utils/const'

const SyncStatus = ({
  syncStatus,
  connectionStatus,
}: React.PropsWithoutRef<{
  syncStatus: SyncStatusEnum
  connectionStatus: State.ConnectionStatus
}>) => {
  const [t] = useTranslation()

  if (connectionStatus === ConnectionStatus.Offline) {
    return <span style={{ color: 'red' }}>{t('sync.sync-failed')}</span>
  }

  if (SyncStatusEnum.FailToFetchTipBlock === syncStatus) {
    return <span>{t('navbar.fail-to-fetch-tip-block-number')}</span>
  }

  if (SyncStatusEnum.SyncNotStart === syncStatus) {
    return <span style={{ color: 'red' }}>{t('navbar.sync-not-start')}</span>
  }

  if (SyncStatusEnum.SyncPending === syncStatus) {
    return <span style={{ color: '#f7ae4d' }}>{t('sync.slow')}</span>
  }

  if (SyncStatusEnum.SyncCompleted === syncStatus) {
    return <span>{t('sync.synced')}</span>
  }

  return <span>{t('sync.syncing')}</span>
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
