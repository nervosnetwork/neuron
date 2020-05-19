import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import NetworkStatus, { NetworkStatusProps } from 'components/NetworkStatus'
import { SyncStatus } from 'utils'

const states: { [index: string]: NetworkStatusProps } = {
  Online: {
    networkName: 'network name',
    tipBlockNumber: '100',
    syncedBlockNumber: '1',
    connectionStatus: 'online' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  Offline: {
    networkName: 'network',
    tipBlockNumber: '100',
    syncedBlockNumber: '1',
    connectionStatus: 'offline' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  '100 synced and 0 tip': {
    networkName: 'network',
    tipBlockNumber: '0',
    syncedBlockNumber: '100',
    connectionStatus: 'offline' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  '100 synced and empty tip': {
    networkName: 'network',
    tipBlockNumber: '',
    syncedBlockNumber: '100',
    connectionStatus: 'offline' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  'not sycned and 100 tip': {
    networkName: 'network',
    tipBlockNumber: '100',
    syncedBlockNumber: '-1',
    connectionStatus: 'offline' as any,
    syncStatus: SyncStatus.Syncing,
    onAction: () => {},
  },
  'not synced and empty tip': {
    networkName: 'network',
    tipBlockNumber: '',
    syncedBlockNumber: '-1',
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
    tipBlockNumber: text('Tip block number', '100'),
    syncedBlockNumber: text('Synced block number', '1'),
    connectionStatus: text('online', 'online') as any,
    syncStatus: number('sync status', 0),
    onAction: () => {},
  }
  return <NetworkStatus {...props} />
})
