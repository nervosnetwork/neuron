import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import GlobalDialog from 'widgets/GlobalDialog'

const stories = storiesOf('Global Dialog', module)

const types: State.GlobalDialogType[] = ['unlock-success', 'rebuild-sync', null]

types.forEach(type => {
  stories.add(type || 'Null', () => {
    return (
      <GlobalDialog type={type} onDismiss={action('Dismiss')} onBackUp={action('onBackUp')} onOk={action('onOk')} />
    )
  })
})
