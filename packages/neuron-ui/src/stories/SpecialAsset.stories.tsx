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
  },
}

const stories = storiesOf('Special Asset', module)

Object.keys(props).forEach(name => {
  stories.add(name, () => {
    return <SpecialAsset {...props[name]} onAction={console.info} />
  })
})
