import React from 'react'
import { storiesOf } from '@storybook/react'
import SUDTAccountList from 'components/SUDTAccountList'

const stories = storiesOf('sUDT Account List', module)

stories.add('Basic', () => {
  return <SUDTAccountList />
})
