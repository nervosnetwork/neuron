import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { CustomizedAssetProps } from 'components/CustomizedAsset'
import CustomizedAssetList from 'components/CustomizedAssetList'

const stories = storiesOf('Customized Asset List', module).addDecorator(StoryRouter())

const propsList: Record<string, { initList: CustomizedAssetProps[] }> = {
  'Empty List': {
    initList: [],
  },
  'Has Assets': {
    initList: [
      {
        type: 'ckb',
        tokenId: 'CKBytes',
        tokenName: 'CKB',
        symbol: 'CKB',
        createdDate: new Date('2020-06-06').getTime().toString(),
        assetAmount: '10000000000000',
        outPoint: {
          txHash: 'tx hash of ckb',
          index: '0x0',
        },
        isMainnet: false,
        isOnline: true,
      },
      {
        type: 'sudt',
        tokenId: 'token id of sudt',
        tokenName: 'SUDT',
        symbol: 'UDT',
        createdDate: new Date('2020-08-08').getTime().toString(),
        assetAmount: '6666666666666666666666666',
        outPoint: {
          txHash: 'tx hash of sudt',
          index: '0x0',
        },
        isMainnet: false,
        isOnline: true,
      },
      {
        type: 'unknown',
        tokenId: 'token id of unknown',
        tokenName: '',
        symbol: '',
        createdDate: new Date('1990-09-01').getTime().toString(),
        assetAmount: '10000',
        outPoint: {
          txHash: 'tx hash',
          index: '0x0',
        },
        isMainnet: false,
        isOnline: true,
      },
    ],
  },
}

Object.entries(propsList).forEach(([title, props]) => {
  stories.add(title, () => <CustomizedAssetList {...props} />)
})
