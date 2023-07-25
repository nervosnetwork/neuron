import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SendMetaInfo from 'components/SendMetaInfo'

const meta: Meta<typeof SendMetaInfo> = {
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

export default meta

type Story = StoryObj<typeof SendMetaInfo>

export const Default: Story = {
  args: {
    outputs: [],
    errorMessage: '',
    totalAmount: '',
    sending: false,
    description: '',
    fee: '',
    price: '',
    handleDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => action('Update Description')(e.target.value),
    handlePriceChange: (value: string) => action('Update Price')(value),
  },
}
