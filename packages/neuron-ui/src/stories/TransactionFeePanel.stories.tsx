import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import TransactionFeePanel from 'components/TransactionFeePanel'

const meta: Meta<typeof TransactionFeePanel> = {
  component: TransactionFeePanel,
}

export default meta

type Story = StoryObj<typeof TransactionFeePanel>

export const Default: Story = {
  args: {
    price: '10',
    fee: '0',
    onPriceChange: (args: any) => action(args),
  },
}
