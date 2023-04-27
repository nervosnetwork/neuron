import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, select, number } from '@storybook/addon-knobs'
import NetworkStatus, { NetworkStatusProps } from 'components/NetworkStatus'

const defaultProps: Omit<NetworkStatusProps, 'syncPercents' | 'syncBlockNumbers'> = {
  network: {
    name: 'network',
    remote: 'http://127.0.0.1:3000',
    type: 0,
    id: 'd',
    chain: 'ckb',
  },
  onAction: () => {},
  isLookingValidTarget: false,
  onOpenValidTarget: () => {},
}

const states: { [index: string]: NetworkStatusProps } = {
  Online: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/200',
  },
  Offline: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/100',
  },
  isLookingValidTarget: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/100',
    isLookingValidTarget: true,
  },
  '100 synced and 0 tip': {
    ...defaultProps,
    syncPercents: 100,
    syncBlockNumbers: '100/0',
  },
  '100 synced and empty tip': {
    ...defaultProps,
    syncPercents: 100,
    syncBlockNumbers: '-/100',
  },
  'not sycned and 100 tip': {
    ...defaultProps,
    syncPercents: 0,
    syncBlockNumbers: '-/100',
  },
  'not synced and empty tip': {
    ...defaultProps,
    syncPercents: 0,
    syncBlockNumbers: '-/-',
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
      remote: text('Remote', 'http://127.0.0.1:3000'),
      type: select('Type', [0, 1], 0) as any,
      id: text('id', 'd'),
      chain: select('Chain', ['ckb', 'ckb_testnet', 'ckb_dev'], 'ckb'),
    },
    syncPercents: number('Sync Percents', 1),
    syncBlockNumbers: text('Sync Block Number', '1/100'),
    onAction: () => {},
    isLookingValidTarget: false,
    onOpenValidTarget: () => {},
  }
  return <NetworkStatus {...props} />
})
