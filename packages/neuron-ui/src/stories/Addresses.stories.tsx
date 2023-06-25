import React from 'react'
import { ComponentStory } from '@storybook/react'
import Addresses from 'components/Addresses'
import { withRouter } from 'storybook-addon-react-router-v6'
import addressesStates from './data/addresses'

export default {
  title: 'Addresses',
  component: Addresses,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
  },
}

const Template: ComponentStory<typeof Addresses> = () => <Addresses />

export const ContentList = Template.bind({})
ContentList.args = { wallet: { addresses: addressesStates['Content List'] } }

export const EmptyList = Template.bind({})
