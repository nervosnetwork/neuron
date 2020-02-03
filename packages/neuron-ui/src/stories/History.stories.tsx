import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { withKnobs, text, number, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import History from 'components/History'
import initStates from 'states/initStates'
import { NeuronWalletContext } from 'states/stateProvider'
import transactions from './data/transactions'

const dispatch = (a: any) => action('Dispatch')(JSON.stringify(a, null, 2))

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
  '200 items and pageNo.2': {
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
  '200 items and pageNo.14': {
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

const stories = storiesOf('History', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, state]) => {
  stories.add(title, () => (
    <NeuronWalletContext.Provider value={{ state, dispatch }}>
      <History />
    </NeuronWalletContext.Provider>
  ))
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const state = {
    ...initStates,
    chain: {
      ...initStates.chain,
      transactions: {
        pageNo: number('Page No', 14),
        pageSize: number('Page Size', 15),
        totalCount: number('Total Count', 200),
        items: transactions['Content List'].map((tx, idx) => ({
          type: text(`${idx}-Type`, tx.type) as 'send' | 'receive',
          createdAt: text(`${idx}-Created at`, tx.createdAt),
          updatedAt: text(`${idx}-Updated at`, tx.updatedAt),
          timestamp: text(`${idx}-Timestamp`, tx.timestamp),
          value: text(`${idx}-Value`, tx.value),
          hash: text(`${idx}-Hash`, tx.hash),
          description: text(`${idx}-Description`, tx.description),
          blockNumber: text(`${idx}-BlockNumber`, tx.blockNumber),
          status: text(`${idx}-Status`, tx.status) as 'pending' | 'success' | 'failed',
          nervosDao: boolean('nervos dao', true),
        })),
        keywords: '',
      },
    },
  }
  return (
    <NeuronWalletContext.Provider value={{ state, dispatch }}>
      <History />
    </NeuronWalletContext.Provider>
  )
})
