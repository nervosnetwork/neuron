import React from 'react'
import { ComponentStory } from '@storybook/react'
import CustomizedAsset from 'components/CustomizedAsset'

export default {
  title: 'Customized Asset',
  component: CustomizedAsset,
}

const Template: ComponentStory<typeof CustomizedAsset> = (props: any) => <CustomizedAsset {...props} />

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

export const ckb = Template.bind({})
ckb.args = { type: 'ckb', ...baseProps }
ckb.storyName = 'type = ckb'

export const sudt = Template.bind({})
sudt.args = { type: 'sudt', ...baseProps }
sudt.storyName = 'type = sudt'

export const unknown = Template.bind({})
unknown.args = { type: 'unknown', ...baseProps }
unknown.storyName = 'type = unknown'
