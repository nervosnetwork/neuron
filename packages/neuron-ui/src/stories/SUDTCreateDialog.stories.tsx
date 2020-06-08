import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTCreateDialog, { TokenInfo, SUDTCreateDialogProps } from 'components/SUDTCreateDialog'

const baseProps = {
  accountName: '',
  tokenName: '',
  symbol: '',
  decimal: '',
  tokenId: '',
  onSubmit: (info: TokenInfo): any => {
    return new Promise(resolve => {
      action('submit')(info)
      resolve(true)
    })
  },
  onCancel: () => action('cancel')(),
  existingAccountNames: ['name1', 'name2'],
}
const propsList: { [name: string]: SUDTCreateDialogProps } = {
  Basic: baseProps,
  'Insufficient For SUDT': { ...baseProps, insufficient: { ckb: false, sudt: true } },
  'Insufficient For CKB': { ...baseProps, insufficient: { ckb: true, sudt: false } },
  'Insufficient For CKB and SUDT': { ...baseProps, insufficient: { ckb: true, sudt: true } },
}

const stories = storiesOf('Create sUDT Account', module)

Object.entries(propsList).forEach(([name, props]) => {
  stories.add(name, () => <SUDTCreateDialog {...props} />)
})
