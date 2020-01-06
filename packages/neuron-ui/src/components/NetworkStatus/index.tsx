import React from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectionStatus } from 'utils/const'

import styles from 'containers/Navbar/navbar.module.scss'

interface NetworkStatusProps {
  networkName: string | null
  connectionStatus: State.ConnectionStatus
  onAction: (e: React.SyntheticEvent) => void
}

const NetworkStatus = ({
  networkName = null,
  connectionStatus = ConnectionStatus.Offline,
  onAction,
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
        <span data-online={connectionStatus === ConnectionStatus.Online}>{networkName}</span>
      ) : (
        <span>{t('settings.setting-tabs.network')}</span>
      )}
    </div>
  )
}

NetworkStatus.displayName = 'NetworkStatus'
export default NetworkStatus
