import { Meta, StoryObj } from '@storybook/react'
import Balance from 'widgets/Balance'

const meta: Meta<typeof Balance> = {
  component: Balance,
  args: {
    balance: '0',
  },
}

export default meta

type Story = StoryObj<typeof Balance>

export const Default: Story = {
  args: {
    balance: '0.00000001',
  },
}
