import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import DepositDialog from 'components/DepositDialog'

const props = {
  show: true,
  value: '123',
  fee: '123',
  onOpen: action('on open'),
  onDismiss: action('on dismiss'),
  onChange: action('on change'),
  onSubmit: action('on submit'),
  onSlide: action('on slide'),
  maxDepositAmount: BigInt('30000000000'),
  isDepositing: false,
  errorMessage: 'Amount is not enough',
  isTxGenerated: true,
}

const stories = storiesOf('Deposit Dialog', module)
stories.add('Basic', () => {
  return <DepositDialog {...props} />
})
