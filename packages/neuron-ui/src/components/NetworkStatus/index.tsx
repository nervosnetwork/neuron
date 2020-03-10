import React from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionStatus, SyncStatus } from 'utils/const'
import { localNumberFormatter } from 'utils/formatters'

import styles from './networkStatus.module.scss'

export interface NetworkStatusProps {
  networkName: string | null
  tipBlockNumber: string
  syncedBlockNumber: string
  connectionStatus: State.ConnectionStatus
  syncStatus: SyncStatus
  onAction: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({
  networkName = null,
  tipBlockNumber,
  syncedBlockNumber,
  connectionStatus = ConnectionStatus.Offline,
  onAction,
  syncStatus = SyncStatus.SyncNotStart,
}: NetworkStatusProps) => {
  const [t] = useTranslation()
  return (
    <div
      role="link"
      id="connected-network-name"
      className={styles.network}
      onClick={onAction}
      onKeyPress={onAction}
      tabIndex={0}
    >
      {networkName ? (
        <div className={styles.tooltip}>
          <span className={styles.tooltipTitle}>{t('network-status.tooltip.block-number')}</span>
          {tipBlockNumber ? (
            <>
              <span>{t('network-status.tooltip.total')}</span>
              <span className={styles.blockNumber}>{localNumberFormatter(tipBlockNumber)}</span>
            </>
          ) : null}
          {+syncedBlockNumber >= 0 ? (
            <>
              <span>{t('network-status.tooltip.synced')}</span>
              <span className={styles.blockNumber}>{localNumberFormatter(syncedBlockNumber)}</span>
            </>
          ) : null}
        </div>
      ) : null}
      {networkName ? (
        <span
          className={styles.name}
          data-online={connectionStatus === ConnectionStatus.Online}
          data-sync-status={SyncStatus[syncStatus]}
        >
          {networkName}
        </span>
      ) : (
        <span>{t('settings.setting-tabs.network')}</span>
      )}
    </div>
  )
}

NetworkStatus.displayName = 'NetworkStatus'
export default NetworkStatus
