import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { ConnectionStatus, SyncStatus } from 'utils'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'

const meta: Meta<typeof BalanceSyncIcon> = {
  component: BalanceSyncIcon,
  argTypes: {
    connectionStatus: { control: 'radio', options: ['online', 'offline', 'connecting'] },
  },
  args: {
    connectionStatus: ConnectionStatus.Connecting,
    syncStatus: SyncStatus.SyncNotStart,
  },
  decorators: [
    Component => (
      <div style={{ backgroundColor: '#eee' }}>
        <Component />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof BalanceSyncIcon>

export const Default: Story = {}
