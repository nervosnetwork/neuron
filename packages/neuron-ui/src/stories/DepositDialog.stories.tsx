import React from 'react'
import { storiesOf } from '@storybook/react'
import DepositDialog from 'components/DepositDialog'

const props = {
  show: true,
  value: '123',
  fee: '123',
  onDismiss: () => {},
  onChange: () => {},
  onSubmit: () => {},
  onSlide: () => {},
  maxDepositAmount: BigInt('30000000000'),
  isDepositing: false,
  errorMessage: 'Amount is not enough',
}

const stories = storiesOf('Deposit Dialog', module)
stories.add('Basic', () => {
  return <DepositDialog {...props} />
})
