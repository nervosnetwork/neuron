import React from 'react'
import { storiesOf } from '@storybook/react'
import SpecialAsset, { SpecialAssetProps } from 'components/SpecialAsset'

const props: {
  [name: string]: SpecialAssetProps
} = {
  'Type and Data': {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: true,
    status: 'locked-asset',
    isMainnet: true,
    txHash: '',
  },
  Type: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'locked-asset',
    isMainnet: true,
    txHash: '',
  },
  Data: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: false,
    hasData: true,
    status: 'locked-asset',
    isMainnet: true,
    txHash: '',
  },
  'User defined asset': {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'user-defined-asset',
    isMainnet: true,
    txHash: '',
  },
  Locked: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'locked-asset',
    isMainnet: true,
    txHash: '',
  },
  Claim: {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    status: 'claim-asset',
    isMainnet: true,
    txHash: '',
  },
}

const stories = storiesOf('Special Asset', module)

Object.keys(props).forEach(name => {
  stories.add(name, () => {
    return <SpecialAsset {...props[name]} />
  })
})
