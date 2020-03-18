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

  let synced = syncedBlockNumber
  if (tipBlockNumber && BigInt(tipBlockNumber) < BigInt(syncedBlockNumber)) {
    synced = tipBlockNumber
  }

  return (
    <div
      role="link"
      id="connected-network-name"
      className={styles.network}
      onClick={onAction}
      onKeyPress={onAction}
      tabIndex={0}
    >
      {networkName && (tipBlockNumber || +synced >= 0) ? (
        <div className={styles.tooltip}>
          <span className={styles.tooltipTitle}>{t('network-status.tooltip.block-number')}</span>
          {tipBlockNumber ? (
            <>
              <span>{t('network-status.tooltip.tip-block')}</span>
              <span className={styles.blockNumber}>{localNumberFormatter(tipBlockNumber)}</span>
            </>
          ) : null}
          {+synced >= 0 ? (
            <>
              <span>{t('network-status.tooltip.synced')}</span>
              <span className={styles.blockNumber}>{localNumberFormatter(synced)}</span>
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
