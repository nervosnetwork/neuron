import { Meta, StoryObj } from '@storybook/react'
import TransactionList from 'components/TransactionList'
import transactions from './data/transactions'

const meta: Meta<typeof TransactionList> = {
  component: TransactionList,
}

export default meta

type Story = StoryObj<typeof TransactionList>

const commArgs = {
  isMainnet: true,
  bestKnownBlockNumber: 123,
  walletID: '1',
  walletName: 'wallet name',
  dispatch: () => {},
}

export const EmptyList: Story = {
  args: {
    ...commArgs,
    items: transactions['Empty List'],
  },
}

export const ContentList: Story = {
  args: {
    ...commArgs,
    items: transactions['Content List'],
  },
}

export const WithEmptyPendingList: Story = {
  args: {
    ...commArgs,
    items: transactions['Content List'].filter(item => item.status !== 'pending'),
  },
}

export const ShimmeredList: Story = {
  args: {
    ...commArgs,
    items: [],
  },
}
