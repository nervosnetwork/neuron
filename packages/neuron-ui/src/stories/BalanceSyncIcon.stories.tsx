import React from 'react'
import { storiesOf } from '@storybook/react'
import { ConnectionStatus, SyncStatus } from 'utils/const'
import BalanceSyncIcon, { BalanceSyncIconProps } from 'components/BalanceSyncingIcon'

const stories = storiesOf('Balance Sync Icon', module)

const propsList: { [index: string]: BalanceSyncIconProps } = {
  Connecting: {
    connectionStatus: ConnectionStatus.Connecting,
    syncStatus: SyncStatus.SyncNotStart,
  },
  Offline: {
    connectionStatus: ConnectionStatus.Offline,
    syncStatus: SyncStatus.SyncNotStart,
  },
  'Fail to fetch tip': {
    connectionStatus: ConnectionStatus.Online,
    syncStatus: SyncStatus.FailToFetchTipBlock,
  },
  Completed: {
    connectionStatus: ConnectionStatus.Online,
    syncStatus: SyncStatus.SyncCompleted,
  },
  'Not Start': {
    connectionStatus: ConnectionStatus.Online,
    syncStatus: SyncStatus.SyncNotStart,
  },
  Pending: {
    connectionStatus: ConnectionStatus.Online,
    syncStatus: SyncStatus.SyncPending,
  },
  Syncing: {
    connectionStatus: ConnectionStatus.Online,
    syncStatus: SyncStatus.Syncing,
  },
}

Object.entries(propsList).forEach(([name, props]) => {
  stories.add(name, () => {
    return <BalanceSyncIcon {...props} />
  })
})
