import React from 'react'
import { useTranslation } from 'react-i18next'
import NetworkTypeLabel from 'components/NetworkTypeLabel'
import { NewTab } from 'widgets/Icons/icon'
import styles from './networkStatus.module.scss'

export interface NetworkStatusProps {
  isMigrate?: boolean
  network: State.Network | undefined
  syncPercents: number
  syncBlockNumbers: string
  onAction: (e: React.SyntheticEvent) => void
  isLookingValidTarget: boolean
  onOpenValidTarget: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({
  network,
  syncPercents,
  syncBlockNumbers,
  onAction,
  isLookingValidTarget,
  onOpenValidTarget,
  isMigrate,
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
      {network && !isMigrate ? (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>
            <span>{t('network-status.tooltip.block-synced')}</span>
            <span>{`${syncPercents}%`}</span>
          </div>
          <span className={styles.blockNumber}>{syncBlockNumbers}</span>
          {isLookingValidTarget && (
            <div
              role="link"
              className={styles.lookingValidTarget}
              onClick={onOpenValidTarget}
              onKeyPress={onOpenValidTarget}
              tabIndex={-1}
            >
              <span>{t('network-status.tooltip.looking-valid-target')}</span>
              <NewTab className={styles.openTarget} />
            </div>
          )}
        </div>
      ) : null}
      {isMigrate && <div className={styles.tooltip}>{t('network-status.migrating')}</div>}
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
