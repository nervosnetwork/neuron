import { Meta, StoryObj } from '@storybook/react'
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

const meta: Meta<typeof Overview> = {
  component: Overview,
  decorators: [withRouter],
  argTypes: {
    chain: { control: 'object', isGlobal: true },
  },
}

export default meta

type Story = StoryObj<typeof Overview>

export const HasNoActivities: Story = {
  args: {
    chain: { ...chain, transactions: { ...chain.transactions, items: [] } },
  },
}

export const Has10Activities: Story = {
  args: {
    chain: {
      ...chain,
      transactions: { ...chain.transactions, items: chain.transactions.items.slice(0, 10) },
    },
  },
}

export const HasOver10Activities: Story = {
  args: {
    chain: {
      ...initStates.chain,
      networkID: 'testnet',
      transactions: { ...initStates.chain.transactions, items: transactions[`Content List`] },
      tipBlockNumber: '123',
    },
  },
}
