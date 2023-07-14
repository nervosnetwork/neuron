import { Meta, StoryObj } from '@storybook/react'
import Receive from 'components/Receive'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'
import addresses from './data/addresses'

const meta: Meta<typeof Receive> = {
  component: Receive,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
  },
}

export default meta

type Story = StoryObj<typeof Receive>

export const HasNoAddresses: Story = {
  args: {
    wallet: {
      ...initStates.wallet,
      addresses: addresses['Empty List'],
    },
  },
}

export const HasAddresses: Story = {
  args: {
    wallet: {
      ...initStates.wallet,
      addresses: addresses['Content List'],
    },
  },
}
