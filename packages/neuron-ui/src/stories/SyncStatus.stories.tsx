import React from 'react'
import { storiesOf } from '@storybook/react'
import { SyncStatus } from 'containers/Footer'

const stories = storiesOf('SyncStatus', module)

const states = {
  '0/0': {
    tipBlockNumber: '0',
    syncedBlockNumber: '0',
    bufferBlockNumber: 10,
  },
  '0/100': {
    tipBlockNumber: '100',
    syncedBlockNumber: '0',
    bufferBlockNumber: 10,
  },
  'syncing 10/100': {
    tipBlockNumber: '100',
    syncedBlockNumber: '10',
    bufferBlockNumber: 10,
  },
  'buffering 89/100': {
    tipBlockNumber: '100',
    syncedBlockNumber: '89',
    bufferBlockNumber: 10,
  },
  'synced 90/100': {
    tipBlockNumber: '100',
    syncedBlockNumber: '90',
    bufferBlockNumber: 10,
  },
  'synced 100/100': {
    tipBlockNumber: '100',
    syncedBlockNumber: '100',
    bufferBlockNumber: 10,
  },
}

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => <SyncStatus {...props} />)
})
