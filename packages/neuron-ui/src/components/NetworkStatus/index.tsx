import React from 'react'
import { useTranslation } from 'react-i18next'
import NetworkTypeLabel from 'components/NetworkTypeLabel'
import { localNumberFormatter } from 'utils'
import styles from './networkStatus.module.scss'

export interface NetworkStatusProps {
  network: State.Network | undefined
  tipBlockNumber: string
  syncedBlockNumber: string
  onAction: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({ network, tipBlockNumber, syncedBlockNumber, onAction }: NetworkStatusProps) => {
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
      {network && (tipBlockNumber || +synced >= 0) ? (
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
      {network ? (
        <div>
          <NetworkTypeLabel type={network.chain} />
          <span className={styles.name}>{network.name}</span>
        </div>
      ) : (
        <span>{t('settings.setting-tabs.network')}</span>
      )}
    </div>
  )
}

NetworkStatus.displayName = 'NetworkStatus'
export default NetworkStatus
