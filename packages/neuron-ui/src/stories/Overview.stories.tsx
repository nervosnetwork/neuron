import React from 'react'
import { Route } from 'react-router-dom'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import Overview from 'components/Overview'
import initStates from 'states/initStates'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import transactions from './data/transactions'

const stateTemplate = {
  dispatch: (dispatchAction: any) => action(dispatchAction),
  ...initStates,
  app: {
    ...initStates.app,
    epoch: '1',
    difficulty: '0x111111',
    chain: 'chain_dev',
  },
  wallet: { ...initStates.wallet, id: 'wallet id', name: 'Current Wallet Name', balance: '213' },
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
      },
    ],
  },
}

const states = {
  'Has no Activities': {
    ...stateTemplate,
    chain: { ...stateTemplate.chain, transactions: { ...stateTemplate.chain.transactions, items: [] } },
  },
  'Has Activities': stateTemplate,
}

const OverviewWithRouteProps = (props: StateWithDispatch) => (
  <Route path="/" render={routeProps => <Overview {...routeProps} {...props} />} />
)

const stories = storiesOf(`Overview`, module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => <OverviewWithRouteProps {...props} />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    dispatch: (dispatchAction: any) => action(dispatchAction),
    ...initStates,
    app: {
      ...initStates.app,
      epoch: text('Epoch', '1'),
      difficulty: text('Difficulty', '0x111'),
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
          type: text(`${idx}-Type`, tx.type) as 'send' | 'receive' | 'other',
          createdAt: text(`${idx}-Created at`, tx.createdAt),
          updatedAt: text(`${idx}-Updated at`, tx.updatedAt),
          timestamp: text(`${idx}-Timestamp`, tx.timestamp),
          value: text(`${idx}-Value`, tx.value),
          hash: text(`${idx}-Hash`, tx.hash),
          description: text(`${idx}-Description`, tx.description),
          status: text(`${idx}-Status`, tx.status) as 'pending' | 'success' | 'failed',
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
        },
      ],
    },
  }
  return <OverviewWithRouteProps {...props} />
})
