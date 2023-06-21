import React from 'react'
import { ComponentStory } from '@storybook/react'
import NetworkStatus, { NetworkStatusProps } from 'components/NetworkStatus'

const defaultProps: Omit<NetworkStatusProps, 'syncPercents' | 'syncBlockNumbers'> = {
  network: {
    name: 'network',
    remote: 'http://127.0.0.1:3000',
    type: 0,
    id: 'd',
    chain: 'ckb',
    genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
  },
  onAction: () => {},
  isLookingValidTarget: false,
  onOpenValidTarget: () => {},
}

export default {
  title: 'Network Status',
  component: NetworkStatus,
  parameters: {
    layout: 'padded',
    paddings: {
      values: [
        { name: 'Small', value: '16px' },
        { name: 'Medium', value: '32px' },
        { name: 'Large', value: '64px' },
      ],
      default: 'Medium',
    },
  },
}

const Template: ComponentStory<typeof NetworkStatus> = (props: any) => <NetworkStatus {...props} />

export const Online = Template.bind({})
Online.args = {
  ...defaultProps,
  syncPercents: 1,
  syncBlockNumbers: '1/200',
}

export const Offline = Template.bind({})
Offline.args = {
  ...defaultProps,
  syncPercents: 1,
  syncBlockNumbers: '1/100',
}

export const isLookingValidTarget = Template.bind({})
isLookingValidTarget.args = {
  ...defaultProps,
  syncPercents: 1,
  syncBlockNumbers: '1/100',
  isLookingValidTarget: true,
}

export const SyncedFinishedAndNotip = Template.bind({})
SyncedFinishedAndNotip.args = {
  ...defaultProps,
  syncPercents: 100,
  syncBlockNumbers: '100/0',
}
SyncedFinishedAndNotip.storyName = '100 synced and 0 tip'

export const SyncedFinishedAndEmptytip = Template.bind({})
SyncedFinishedAndEmptytip.args = {
  ...defaultProps,
  syncPercents: 100,
  syncBlockNumbers: '-/100',
}
SyncedFinishedAndEmptytip.storyName = '100 synced and empty tip'

export const NotSycnedAnd100Tip = Template.bind({})
NotSycnedAnd100Tip.args = {
  ...defaultProps,
  syncPercents: 0,
  syncBlockNumbers: '-/100',
}

export const NotSyncedAndEmptyTip = Template.bind({})
NotSyncedAndEmptyTip.args = {
  ...defaultProps,
  syncPercents: 0,
  syncBlockNumbers: '-/-',
}
