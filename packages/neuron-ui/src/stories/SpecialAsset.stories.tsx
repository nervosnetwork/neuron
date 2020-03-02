import React from 'react'
import { storiesOf } from '@storybook/react'
import SpecialAsset, { SpecialAssetProps } from 'components/SpecialAsset'

const props: {
  [name: string]: Omit<SpecialAssetProps, 'onAction'>
} = {
  'Type and Data': {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: true,
    status: 'locked-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  Type: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'locked-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  Data: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: false,
    hasData: true,
    status: 'locked-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  'User defined asset': {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'user-defined-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  Locked: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'locked-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  Claim: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'claim-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'online',
    tipBlockTimestamp: Date.now(),
  },
  Offline: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'claim-asset',
    isMainnet: true,
    outPoint: {
      txHash: '',
      index: '',
    },
    connectionStatus: 'offline',
    tipBlockTimestamp: Date.now(),
  },
}

const stories = storiesOf('Special Asset', module)

Object.keys(props).forEach(name => {
  stories.add(name, () => {
    return <SpecialAsset {...props[name]} onAction={console.info} />
  })
})
