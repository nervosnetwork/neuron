import React from 'react'
import { Route } from 'react-router-dom'
import { storiesOf } from '@storybook/react'
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
    difficulty: '0x111',
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
