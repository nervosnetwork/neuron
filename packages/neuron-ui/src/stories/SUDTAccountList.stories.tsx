import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import SUDTAccountList from 'components/SUDTAccountList'

const stories = storiesOf('sUDT Account List', module).addDecorator(withRouter())

stories.add('Basic', () => {
  return <SUDTAccountList />
})
