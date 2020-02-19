import React from 'react'
import { storiesOf } from '@storybook/react'
import SpecialAsset from 'components/SpecialAsset'

const stories = storiesOf('Special Asset', module)
stories.add('Basic', () => {
  const props = {
    datetime: new Date().getTime(),
    capacity: '123456789012345678',
    hasTypeScript: true,
    hasData: false,
    actionLabel: 'Locked Asset' as any,
    isMainnet: true,
    txHash: '',
  }
  return <SpecialAsset {...props} />
})
