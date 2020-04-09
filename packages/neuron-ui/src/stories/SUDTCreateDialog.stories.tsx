import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTCreateDialog from 'components/SUDTCreateDialog'

const stories = storiesOf('Create sUDT Account', module)

stories.add('Basic', () => {
  return (
    <SUDTCreateDialog
      accountName=""
      tokenName=""
      symbol=""
      decimal=""
      tokenId=""
      onSubmit={info => {
        return new Promise(resolve => {
          action('submit')(info)
          resolve(true)
        })
      }}
      onCancel={() => action('cancel')()}
      existingAccountNames={['name1', 'name2']}
    />
  )
})
