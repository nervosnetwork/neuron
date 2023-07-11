import { Meta, StoryObj } from '@storybook/react'
import Addresses from 'components/Addresses'
import { withRouter } from 'storybook-addon-react-router-v6'
import addressesStates from './data/addresses'

const meta: Meta<typeof Addresses> = {
  component: Addresses,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
  },
}
export default meta

type Story = StoryObj<typeof Addresses>

export const ContentList: Story = {
  args: {
    wallet: { addresses: addressesStates['Content List'] },
  },
}

export const EmptyList: Story = {}
