import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import SyncStatus from 'components/SyncStatus'

const stories = storiesOf('SyncStatus', module)

const states = {
  '0/0': {
    tipBlockNumber: '0',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '0',
    bufferBlockNumber: 10,
  },
  '0/100': {
    tipBlockNumber: '100',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '0',
    bufferBlockNumber: 10,
  },
  'syncing 10/100': {
    tipBlockNumber: '100',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '10',
    bufferBlockNumber: 10,
  },
  'buffering 89/100': {
    tipBlockNumber: '100',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '89',
    bufferBlockNumber: 10,
  },
  'synced 90/100': {
    tipBlockNumber: '100',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '90',
    bufferBlockNumber: 10,
  },
  'synced 100/100': {
    tipBlockNumber: '100',
    tipBlockTimestamp: 0,
    syncedBlockNumber: '100',
    bufferBlockNumber: 10,
  },
}

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => <SyncStatus {...props} />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    tipBlockNumber: text('Tip block number', '100'),
    tipBlockTimestamp: number('Tip block timestamp', 0),
    syncedBlockNumber: text('Synced block number', '0'),
    bufferBlockNumber: number('Buffer block number', 10),
  }
  return <SyncStatus {...props} />
})
