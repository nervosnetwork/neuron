import React from 'react'
import { storiesOf } from '@storybook/react'
import GlobalDialog from 'widgets/GlobalDialog'

const stories = storiesOf('Global Dialog', module)
stories.add('Basic', () => {
  return (
    <GlobalDialog
      type="unlock-success"
      onDismiss={() => {
        console.info('dismiss')
      }}
    />
  )
})
