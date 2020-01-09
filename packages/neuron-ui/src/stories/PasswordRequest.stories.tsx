import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import StoryRouter from 'storybook-react-router'
import PasswordRequest from 'components/PasswordRequest'
import initStates from 'states/initStates'

const states: { [title: string]: State.AppWithNeuronWallet } = {
  'Wallet not Found': {
    ...initStates,
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
        password: '',
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
        password: '',
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
        password: '123456',
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
        password: '',
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
        password: '123456',
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
        password: '123456',
      },
    },
  },
}

const stories = storiesOf('PasswordRequest', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => (
    <PasswordRequest
      {...props}
      dispatch={reducerAction => action('Dispatch')(JSON.stringify(reducerAction, null, 2))}
    />
  ))
})
