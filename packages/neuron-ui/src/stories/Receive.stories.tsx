import { Meta, StoryObj } from '@storybook/react'
import Receive from 'components/Receive'

const meta: Meta<typeof Receive> = {
  component: Receive,
  argTypes: {
    onClose: () => {},
  },
}

export default meta

type Story = StoryObj<typeof Receive>

export const HasNoAddresses: Story = {
  args: {
    onClose: () => {},
  },
}
