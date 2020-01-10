import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import PasswordRequest from 'components/PasswordRequest'
import initStates from 'states/initStates'

const dispatch = (a: any) => action('Dispatch')(JSON.stringify(a, null, 2))

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
  console.info(props)
  stories.add(title, () => <PasswordRequest dispatch={dispatch} />)
})
