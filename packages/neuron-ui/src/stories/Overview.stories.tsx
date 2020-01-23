import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import Overview from 'components/Overview'
import initStates from 'states/initStates'
import transactions from './data/transactions'
import addresses from './data/addresses'

const stateTemplate = {
  dispatch: (dispatchAction: any) => action(dispatchAction),
  ...initStates,
  app: {
    ...initStates.app,
    epoch: '1',
    difficulty: BigInt('0x111111'),
    chain: 'chain_dev',
  },
  wallet: {
    ...initStates.wallet,
    id: 'wallet id',
    name: 'Current Wallet Name',
    balance: '213',
    addresses: addresses['Content List'],
  },
  chain: {
    ...initStates.chain,
    networkID: 'testnet',
    transactions: { ...initStates.chain.transactions, items: transactions[`Content List`] },
    tipBlockNumber: '123',
  },
  settings: {
    ...initStates.settings,
    networks: [
      {
        id: 'testnet',
        name: 'Testnet',
        remote: 'http://testnet.nervos.com',
        chain: 'ckb_testnet',
        type: 1 as 0 | 1,
      },
    ],
  },
}

const states = {
  'Has no Activities': {
    ...stateTemplate,
    chain: { ...stateTemplate.chain, transactions: { ...stateTemplate.chain.transactions, items: [] } },
  },
  'Has 10 Activities': {
    ...stateTemplate,
    chain: {
      ...stateTemplate.chain,
      transactions: { ...stateTemplate.chain.transactions, items: stateTemplate.chain.transactions.items.slice(0, 10) },
    },
  },
  'Has more than 10 Activities': stateTemplate,
}

const stories = storiesOf(`Overview`, module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, props]) => {
  console.info(props)
  stories.add(title, () => <Overview />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    dispatch: (dispatchAction: any) => action(dispatchAction),
    ...initStates,
    app: {
      ...initStates.app,
      epoch: text('Epoch', '1'),
      difficulty: BigInt(100000),
      chain: text('Chain', 'chain_dev'),
    },
    wallet: {
      ...initStates.wallet,
      id: text('Wallet ID', 'wallet id'),
      name: text('Wallet Name', 'Current Wallet Name'),
      balance: text('Balance', '213'),
    },
    chain: {
      ...initStates.chain,
      networkID: text('Network ID', 'testnet'),
      transactions: {
        ...initStates.chain.transactions,
        items: transactions[`Content List`].map((tx, idx) => ({
          type: text(`${idx}-Type`, tx.type) as 'send' | 'receive',
          createdAt: text(`${idx}-Created at`, tx.createdAt),
          updatedAt: text(`${idx}-Updated at`, tx.updatedAt),
          timestamp: text(`${idx}-Timestamp`, tx.timestamp),
          value: text(`${idx}-Value`, tx.value),
          hash: text(`${idx}-Hash`, tx.hash),
          description: text(`${idx}-Description`, tx.description),
          blockNumber: text(`${idx}-BlockNumber`, tx.blockNumber),
          status: text(`${idx}-Status`, tx.status) as 'pending' | 'success' | 'failed',
          nervosDao: boolean('nervos dao', false),
        })),
      },
      tipBlockNumber: text('Tip block number', '123'),
    },
    settings: {
      ...initStates.settings,
      networks: [
        {
          id: text('Network iD', 'testnet'),
          name: text('Network Name', 'Testnet'),
          remote: text('Network Address', 'http://testnet.nervos.com'),
          chain: text('Chain', 'ckb_testnet'),
          type: 1 as 0 | 1,
        },
      ],
    },
  }
  console.info(props)
  return <Overview />
})
