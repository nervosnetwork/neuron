import React from 'react'
import { ComponentStory } from '@storybook/react'
import Overview from 'components/Overview'
import { initStates } from 'states'
import { withRouter } from 'storybook-addon-react-router-v6'
import transactions from './data/transactions'

const chain = {
  ...initStates.chain,
  networkID: 'testnet',
  transactions: { ...initStates.chain.transactions, items: transactions[`Content List`] },
  tipBlockNumber: '123',
}

export default {
  title: 'Overview',
  component: Overview,
  decorators: [withRouter],
  argTypes: {
    chain: { control: 'object', isGlobal: true },
  },
}

const Template: ComponentStory<typeof Overview> = () => <Overview />

export const HasNoActivities = Template.bind({})
HasNoActivities.args = {
  chain: { ...chain, transactions: { ...chain.transactions, items: [] } },
}

export const Has10Activities = Template.bind({})
Has10Activities.args = {
  chain: {
    ...chain,
    transactions: { ...chain.transactions, items: chain.transactions.items.slice(0, 10) },
  },
}

export const HasOver10Activities = Template.bind({})
HasOver10Activities.args = {
  chain: {
    ...initStates.chain,
    networkID: 'testnet',
    transactions: { ...initStates.chain.transactions, items: transactions[`Content List`] },
    tipBlockNumber: '123',
  },
}
