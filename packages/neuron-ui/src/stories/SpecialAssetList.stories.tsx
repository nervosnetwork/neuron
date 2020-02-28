import React from 'react'
import { storiesOf } from '@storybook/react'
import SpecialAssetList from 'components/SpecialAssetList'

const stories = storiesOf('Special Asset List', module)

stories.add('basic', () => {
  return <SpecialAssetList />
})
