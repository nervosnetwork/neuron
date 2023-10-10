import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import History from 'components/History'
import { initStates } from 'states'
import transactions from './data/transactions'

const states: { [title: string]: any } = {
  'Has not transactions': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: { ...initStates.chain.transactions, items: transactions['Empty List'] },
    },
  },
  '1 item and PageNo.1': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 1,
        pageSize: 15,
        totalCount: 1,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
  '15 items and PageNo.1': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 1,
        pageSize: 15,
        totalCount: 15,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
  '16 items and PageNo.2': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 2,
        pageSize: 15,
        totalCount: 16,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
  '200 items and PageNo.1': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 1,
        pageSize: 15,
        totalCount: 200,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
  '200 items and PageNo.2': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 2,
        pageSize: 15,
        totalCount: 200,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
  '200 items and PageNo.14': {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: 14,
        pageSize: 15,
        totalCount: 200,
        items: transactions['Content List'],
        keywords: '',
      },
    },
  },
}

const meta: Meta<typeof History> = {
  component: History,
  decorators: [withRouter],
  argTypes: {
    chain: { control: 'object', isGlobal: true },
  },
}

export default meta

type Story = StoryObj<typeof History>

export const HasNotTransactions: Story = {
  args: {
    chain: {
      ...initStates.chain,
      transactions: states['Has not transactions'].chain.transactions,
    },
  },
}

export const OneItem: Story = {
  args: { chain: { ...initStates.chain, transactions: states['1 item and PageNo.1'].chain.transactions } },
  name: '1 item and PageNo.1',
}

export const MoreItem: Story = {
  args: { chain: { ...initStates.chain, transactions: states['15 items and PageNo.1'].chain.transactions } },
  name: '15 items and PageNo.1',
}

export const MorePage: Story = {
  args: { chain: { ...initStates.chain, transactions: states['16 items and PageNo.2'].chain.transactions } },
  name: '16 items and PageNo.2',
}
export const MoreItemOnPage: Story = {
  args: {
    chain: { ...initStates.chain, transactions: states['200 items and PageNo.1'].chain.transactions },
  },
  name: '200 items and PageNo.1',
}

export const MoreItemOnNextPage: Story = {
  args: {
    chain: { ...initStates.chain, transactions: states['200 items and PageNo.2'].chain.transactions },
  },
  name: '200 items and PageNo.2',
}

export const MoreItemOnPage14: Story = {
  args: {
    chain: { ...initStates.chain, transactions: states['200 items and PageNo.14'].chain.transactions },
  },
  name: '200 items and PageNo.14',
}
