import React from 'react'
import { ComponentStory } from '@storybook/react'
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

export default {
  title: 'History',
  component: History,
  decorators: [withRouter],
  argTypes: {
    chain: { control: 'object', isGlobal: true },
  },
}

const Template: ComponentStory<typeof History> = () => <History />

export const HasNotTransactions = Template.bind({})
HasNotTransactions.args = {
  chain: { ...initStates.chain, transactions: states['Has not transactions'].chain.transactions },
}

export const OneItem = Template.bind({})
OneItem.args = { chain: { ...initStates.chain, transactions: states['1 item and PageNo.1'].chain.transactions } }
OneItem.storyName = '1 item and PageNo.1'

export const MoreItem = Template.bind({})
MoreItem.args = { chain: { ...initStates.chain, transactions: states['15 items and PageNo.1'].chain.transactions } }
MoreItem.storyName = '15 items and PageNo.1'

export const MorePage = Template.bind({})
MorePage.args = { chain: { ...initStates.chain, transactions: states['16 items and PageNo.2'].chain.transactions } }
MorePage.storyName = '16 items and PageNo.2'

export const MoreItemOnPage = Template.bind({})
MoreItemOnPage.args = {
  chain: { ...initStates.chain, transactions: states['200 items and PageNo.1'].chain.transactions },
}
MoreItemOnPage.storyName = '200 items and PageNo.1'

export const MoreItemOnNextPage = Template.bind({})
MoreItemOnNextPage.args = {
  chain: { ...initStates.chain, transactions: states['200 items and PageNo.2'].chain.transactions },
}
MoreItemOnNextPage.storyName = '200 items and PageNo.2'

export const MoreItemOnPage14 = Template.bind({})
MoreItemOnPage14.args = {
  chain: { ...initStates.chain, transactions: states['200 items and PageNo.14'].chain.transactions },
}
MoreItemOnPage14.storyName = '200 items and PageNo.14'
