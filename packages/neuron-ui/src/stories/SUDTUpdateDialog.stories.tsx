import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTUpdateDialog from 'components/SUDTUpdateDialog'

const stories = storiesOf('Update sUDT Account', module)

stories.add('sUDT Token', () => {
  return (
    <SUDTUpdateDialog
      isCKB={false}
      accountName="account name"
      tokenName="token name"
      symbol="symbol"
      decimal="8"
      tokenId="token id"
      accountId="account id"
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

stories.add('CKB', () => {
  return (
    <SUDTUpdateDialog
      isCKB
      accountName="account name"
      tokenName="token name"
      symbol="symbol"
      decimal="8"
      tokenId="token id"
      accountId="account id"
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
