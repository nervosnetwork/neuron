import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, text, select } from '@storybook/addon-knobs'
import CustomizedAsset, { CustomizedAssetProps } from 'components/CustomizedAsset'

const stories = storiesOf('Customized Asset', module)
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
const propsList: Record<string, CustomizedAssetProps> = {
  'type = ckb': {
    type: 'ckb',
    ...baseProps,
  },
  'type = sudt': {
    type: 'sudt',
    ...baseProps,
  },
  'type = unknown': {
    type: 'unknown',
    ...baseProps,
  },
}

Object.entries(propsList).forEach(([title, props]) => {
  stories.add(title, () => {
    return <CustomizedAsset {...props} />
  })
})

stories.addDecorator(withKnobs()).add('With Knob', () => {
  const props: CustomizedAssetProps = {
    type: select('Type', ['ckb', 'sudt', 'unknown'], 'ckb', 'type') as CustomizedAssetProps['type'],
    tokenId: text('Token Id', 'token id'),
    tokenName: text('Token Name', 'token name'),
    symbol: text('Symbol', 'SYM'),
    createdDate: text('Created Date', Date.now().toString()),
    assetAmount: text('Amount', '10000'),
    outPoint: {
      txHash: text('Tx Hash', 'tx hash'),
      index: text('Index', '0x0'),
    },
    isMainnet: boolean('Is Mainnet', false),
    isOnline: boolean('Is Online', false),
  }
  return <CustomizedAsset {...props} />
})
