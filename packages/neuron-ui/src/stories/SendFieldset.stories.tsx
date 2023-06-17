import React from 'react'
import { ComponentStory } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SendFieldset from 'components/SendFieldset'

export default {
  title: 'Send Fieldset',
  component: SendFieldset,
  argTypes: {
    onOutputAdd: { table: { disable: true } },
    onOutputRemove: { table: { disable: true } },
    onLocktimeClick: { table: { disable: true } },
    onItemChange: { table: { disable: true } },
    onScan: { table: { disable: true } },
    onSendMaxClick: { table: { disable: true } },
  },
}

const Template: ComponentStory<typeof SendFieldset> = (props: any) => <SendFieldset {...props} />

export const Common = Template.bind({})
Common.args = {
  idx: 100,
  item: {
    disabled: false,
    date: '',
    address: '',
    amount: '',
  },
  errors: {
    addrError: undefined,
    amountError: undefined,
  },
  isSendMax: false,
  isMaxBtnDisabled: false,
  isMaxBtnShow: false,
  isRemoveBtnShow: false,
  onOutputRemove: (e: any) => action('Remove Transaction Output')(JSON.stringify(e.target.dataset)),
  onLocktimeClick: (e: any) => action('Timelock Click')(JSON.stringify(e.target.dataset)),
  onItemChange: (e: any) => action('Item Change')(JSON.stringify(e.target.dataset), e.target.value),
  onSendMaxClick: (e: any) => action('Click Send Max button')(JSON.stringify(e.target.dataset)),
  isMainnet: false,
}
