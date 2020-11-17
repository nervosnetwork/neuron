import React from 'react'
import { useTranslation } from 'react-i18next'
import NetworkTypeLabel from 'components/NetworkTypeLabel'
import styles from './networkStatus.module.scss'

export interface NetworkStatusProps {
  network: State.Network | undefined
  syncPercents: number
  syncBlockNumbers: string
  onAction: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({ network, syncPercents, syncBlockNumbers, onAction }: NetworkStatusProps) => {
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
      {network ? (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>
            <span>{t('network-status.tooltip.block-synced')}</span>
            <span>{`${syncPercents}%`}</span>
          </div>
          <span className={styles.blockNumber}>{syncBlockNumbers}</span>
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
