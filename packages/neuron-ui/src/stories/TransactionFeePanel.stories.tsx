import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import TransactionFeePanel from 'components/TransactionFeePanel'

const states = {
  default: {
    cycles: '180',
    price: '10',
    fee: '0',
    onPriceChange: (args: any) => action(args),
  },
}

const stories = storiesOf('Transaction Fee', module)

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => <TransactionFeePanel {...props} />)
})
