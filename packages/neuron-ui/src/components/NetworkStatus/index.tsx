import React from 'react'
import { useTranslation } from 'react-i18next'
import NetworkTypeLabel from 'components/NetworkTypeLabel'
import { localNumberFormatter } from 'utils'
import styles from './networkStatus.module.scss'

export interface NetworkStatusProps {
  network: State.Network | undefined
  bestKnownBlockNumber: number
  cacheTipBlockNumber: number
  onAction: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({ network, bestKnownBlockNumber, cacheTipBlockNumber, onAction }: NetworkStatusProps) => {
  const [t] = useTranslation()

  const synced = Math.min(bestKnownBlockNumber, cacheTipBlockNumber)

  return (
    <div
      role="link"
      id="connected-network-name"
      className={styles.network}
      onClick={onAction}
      onKeyPress={onAction}
      tabIndex={0}
    >
      {network && (bestKnownBlockNumber >= 0 || synced >= 0) ? (
        <div className={styles.tooltip}>
          <span className={styles.tooltipTitle}>{t('network-status.tooltip.block-number')}</span>
          {bestKnownBlockNumber >= 0 ? (
            <>
              <span>{t('network-status.tooltip.tip-block')}</span>
              <span className={styles.blockNumber}>{localNumberFormatter(bestKnownBlockNumber)}</span>
            </>
          ) : null}
          {synced >= 0 ? (
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
