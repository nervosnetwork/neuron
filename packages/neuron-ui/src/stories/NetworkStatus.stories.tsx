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
    syncPercents: 1,
    syncBlockNumbers: '1/200',
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
    syncPercents: 1,
    syncBlockNumbers: '1/100',
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
    syncPercents: 100,
    syncBlockNumbers: '100/0',
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
    syncPercents: 100,
    syncBlockNumbers: '-/100',
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
    syncPercents: 0,
    syncBlockNumbers: '-/100',
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
    syncPercents: 0,
    syncBlockNumbers: '-/-',
    onAction: () => {},
  },
}

const stories = storiesOf('Network Status', module).addDecorator(withKnobs)

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
    syncPercents: number('Sync Percents', 1),
    syncBlockNumbers: text('Sync Block Number', '1/100'),
    onAction: () => {},
  }
  return <NetworkStatus {...props} />
})
