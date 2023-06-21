import React from 'react'
import { ConnectionStatus, SyncStatus } from 'utils'
import { Confirming } from 'widgets/Icons/icon'
import styles from './balanceSyncIcon.module.scss'

export interface BalanceSyncIconProps {
  connectionStatus: State.ConnectionStatus
  syncStatus: SyncStatus
}

const BalanceSyncIcon = ({ connectionStatus, syncStatus }: BalanceSyncIconProps) => {
  if (ConnectionStatus.Connecting === connectionStatus || ConnectionStatus.Offline === connectionStatus) {
    return <Confirming className={styles.confirm} />
  }
  switch (syncStatus) {
    case SyncStatus.SyncCompleted:
      return null
    default: {
      return <Confirming className={styles.confirm} />
    }
  }
}

BalanceSyncIcon.displayName = 'BalanceSyncIcon'
export default BalanceSyncIcon
