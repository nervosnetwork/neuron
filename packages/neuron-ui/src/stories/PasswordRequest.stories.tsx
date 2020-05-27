import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import StoryRouter from 'storybook-react-router'
import PasswordRequest from 'components/PasswordRequest'
import { initStates, NeuronWalletContext } from 'states'

const dispatch = action('Dispatch')

const states: { [title: string]: State.AppWithNeuronWallet } = {
  'Wallet not Found': {
    ...initStates,
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  'Empty Password of Delete Wallet': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  'Content Password of Delete Wallet': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  'Empty Password of Backup Wallet': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'backup',
      },
    },
  },
  'Content Password of Backup Wallet': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'backup',
      },
    },
  },
  'Empty Password of Unlock': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'unlock',
      },
    },
  },
  'Send Transaction': {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'send',
      },
    },
  },
}

const stories = storiesOf('PasswordRequest', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, state]) => {
  stories.add(title, () => (
    <NeuronWalletContext.Provider value={{ state, dispatch }}>
      <PasswordRequest />
    </NeuronWalletContext.Provider>
  ))
})
