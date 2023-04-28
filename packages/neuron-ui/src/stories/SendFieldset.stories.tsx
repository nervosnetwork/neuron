import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs'
import SendFieldset from 'components/SendFieldset'

const stories = storiesOf('Send Fieldset', module).addDecorator(withKnobs())
stories.add('Common', () => {
  const props = {
    idx: number('index', 100),
    item: {
      disabled: boolean('Disabled', false),
      date: text('Date', ''),
      address: text('Address', ''),
      amount: text('Amount', ''),
    },
    errors: {
      addrError: undefined,
      amountError: undefined,
    },
    isSendMax: boolean('Send Max is set', false),
    isMaxBtnDisabled: boolean('Send Max button is disabled', false),
    isMaxBtnShow: boolean('Show Send Max button', false),
    isAddOneBtnDisabled: boolean('Add One button is disabled', false),
    isRemoveBtnShow: boolean('Show Remove button', false),
    isAddBtnShow: boolean('Show Add button', false),
    onOutputAdd: () => action('Add Transaction Output'),
    onOutputRemove: (e: any) => action('Remove Transaction Output')(JSON.stringify(e.target.dataset)),
    onLocktimeClick: (e: any) => action('Timelock Click')(JSON.stringify(e.target.dataset)),
    onItemChange: (e: any) => action('Item Change')(JSON.stringify(e.target.dataset), e.target.value),
    onScan: () => action('Scan'),
    onSendMaxClick: (e: any) => action('Click Send Max button')(JSON.stringify(e.target.dataset)),
    isMainnet: false
  }
  return <SendFieldset {...props} />
})
