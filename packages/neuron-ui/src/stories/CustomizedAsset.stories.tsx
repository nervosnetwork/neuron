import { Meta, StoryObj } from '@storybook/react'
import CustomizedAsset from 'components/CustomizedAsset'

const meta: Meta<typeof CustomizedAsset> = {
  component: CustomizedAsset,
}
export default meta

type Story = StoryObj<typeof CustomizedAsset>

const baseProps = {
  tokenId: 'token id',
  tokenName: 'token name',
  symbol: 'SYM',
  createdDate: Date.now().toString(),
  assetAmount: '10000',
  outPoint: {
    txHash: 'tx hash',
    index: '0x0',
  },
  isMainnet: false,
  isOnline: false,
}

export const ckb: Story = {
  args: { type: 'ckb', ...baseProps },
  name: 'type = ckb',
}

export const sudt: Story = {
  args: { type: 'sudt', ...baseProps },
  name: 'type = sudt',
}

export const unknown: Story = {
  args: { type: 'unknown', ...baseProps },
  name: 'type = unknown',
}
