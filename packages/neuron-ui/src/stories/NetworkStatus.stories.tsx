import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, select, number } from '@storybook/addon-knobs'
import NetworkStatus, { NetworkStatusProps } from 'components/NetworkStatus'

const states: { [index: string]: NetworkStatusProps } = {
  Online: {
    network: {
      name: 'network name',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '100',
    cacheTipBlockNumber: 1,
    onAction: () => {},
  },
  Offline: {
    network: {
      name: 'network',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '100',
    cacheTipBlockNumber: 1,
    onAction: () => {},
  },
  '100 synced and 0 tip': {
    network: {
      name: 'network',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '0',
    cacheTipBlockNumber: 100,
    onAction: () => {},
  },
  '100 synced and empty tip': {
    network: {
      name: 'network',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '',
    cacheTipBlockNumber: 100,
    onAction: () => {},
  },
  'not sycned and 100 tip': {
    network: {
      name: 'network',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '100',
    cacheTipBlockNumber: -1,
    onAction: () => {},
  },
  'not synced and empty tip': {
    network: {
      name: 'network',
      remote: 'http://localhost:3000',
      type: 0,
      id: 'd',
      chain: 'ckb',
    },
    tipBlockNumber: '',
    cacheTipBlockNumber: -1,
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
    network: {
      name: text('Network name', 'network name'),
      remote: text('Remote', 'http://localhost:3000'),
      type: select('Type', [0, 1], 0) as any,
      id: text('id', 'd'),
      chain: select('Chain', ['ckb', 'ckb_testnet', 'ckb_dev'], 'ckb'),
    },
    tipBlockNumber: text('Tip block number', '100'),
    cacheTipBlockNumber: number('Synced block number', 1),
    onAction: () => {},
  }
  return <NetworkStatus {...props} />
})
