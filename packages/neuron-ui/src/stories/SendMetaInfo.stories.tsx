import React from 'react'
import { ComponentStory } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SendMetaInfo from 'components/SendMetaInfo'

export default {
  title: 'Send Meta Info',
  component: SendMetaInfo,
  argTypes: {
    handleDescriptionChange: {
      table: {
        disable: true,
      },
    },
    handlePriceChange: {
      table: {
        disable: true,
      },
    },
  },
}

const Template: ComponentStory<typeof SendMetaInfo> = (props: any) => <SendMetaInfo {...props} />

export const Common = Template.bind({})
Common.args = {
  outputs: [],
  errorMessage: '',
  totalAmount: '',
  sending: false,
  description: '',
  fee: '',
  price: '',
  handleDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => action('Update Description')(e.target.value),
  handlePriceChange: (value: string) => action('Update Price')(value),
}
