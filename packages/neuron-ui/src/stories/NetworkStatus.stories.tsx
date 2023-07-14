import { Meta, StoryObj } from '@storybook/react'
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

const meta: Meta<typeof NetworkStatus> = {
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

export default meta

type Story = StoryObj<typeof NetworkStatus>

export const Online: Story = {
  args: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/200',
  },
}

export const Offline: Story = {
  args: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/100',
  },
}

export const isLookingValidTarget: Story = {
  args: {
    ...defaultProps,
    syncPercents: 1,
    syncBlockNumbers: '1/100',
    isLookingValidTarget: true,
  },
}

export const SyncedFinishedAndNotip: Story = {
  args: {
    ...defaultProps,
    syncPercents: 100,
    syncBlockNumbers: '100/0',
  },
  storyName: '100 synced and 0 tip',
}

export const SyncedFinishedAndEmptytip: Story = {
  args: {
    ...defaultProps,
    syncPercents: 100,
    syncBlockNumbers: '-/100',
  },
  storyName: '100 synced and empty tip',
}

export const NotSycnedAnd100Tip: Story = {
  args: {
    ...defaultProps,
    syncPercents: 0,
    syncBlockNumbers: '-/100',
  },
}

export const NotSyncedAndEmptyTip: Story = {
  args: {
    ...defaultProps,
    syncPercents: 0,
    syncBlockNumbers: '-/-',
  },
}
