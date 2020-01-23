import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import NetworkStatus from 'components/NetworkStatus'
import { SyncStatus } from 'utils/const'

const states = {
  Online: {
    networkName: 'network name',
    connectionStatus: 'online' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  Offline: {
    networkName: 'network',
    connectionStatus: 'offline' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
}

const stories = storiesOf('Connection Status', module).addDecorator(withKnobs)

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => {
    return <NetworkStatus {...props} />
  })
})

stories.add('With knobs', () => {
  const props = {
    networkName: text('Network name', 'network name'),
    connectionStatus: text('online', 'online') as any,
    syncStatus: number('sync status', 0),
    onAction: () => {},
  }
  return <NetworkStatus {...props} />
})
