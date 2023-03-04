import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import SendMetaInfo from 'components/SendMetaInfo'

const stories = storiesOf('Send Meta Info', module).addDecorator(withKnobs())
stories.add('Common', () => {
  const props = {
    outputs: [],
    errorMessage: text('Error Message', ''),
    totalAmount: text('Total Amount', ''),
    sending: boolean('Sending', false),
    description: text('Description', ''),
    fee: text('Fee', ''),
    price: text('Price', ''),
    handleDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => action('Update Description')(e.target.value),
    handlePriceChange: (value: string) => action('Update Price')(value),
  }
  return <SendMetaInfo {...props} />
})
