import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SpecialAssetList from 'components/SpecialAssetList'

const stories = storiesOf('Special Asset List', module).addDecorator(withRouter())

stories.add('basic', () => {
  return <SpecialAssetList />
})
