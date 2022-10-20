import React from 'react'
import { ComponentStory } from '@storybook/react'
import Receive from 'components/Receive'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'
import addresses from './data/addresses'

export default {
  title: 'Receive',
  component: Receive,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
  },
}

const Template: ComponentStory<typeof Receive> = () => <Receive />

export const HasNoAddresses = Template.bind({})
HasNoAddresses.args = {
  wallet: {
    ...initStates.wallet,
    addresses: addresses['Empty List'],
  },
}

export const HasAddresses = Template.bind({})
HasAddresses.args = {
  wallet: {
    ...initStates.wallet,
    addresses: addresses['Content List'],
  },
}
