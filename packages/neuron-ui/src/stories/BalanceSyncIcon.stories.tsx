import React from 'react'
import { ConnectionStatus, SyncStatus } from 'utils'
import BalanceSyncIcon, { BalanceSyncIconProps } from 'components/BalanceSyncingIcon'

export default {
  title: 'Balance Sync Icon',
  component: BalanceSyncIcon,
  argTypes: {
    connectionStatus: { control: 'radio', options: ['online', 'offline', 'connecting'] },
  },
  args: {
    connectionStatus: ConnectionStatus.Connecting,
    syncStatus: SyncStatus.SyncNotStart,
  },
}

export const Basic = (props: BalanceSyncIconProps) => <BalanceSyncIcon {...props} />
