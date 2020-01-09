import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import WalletSetting from 'components/WalletSetting'
import initStates from 'states/initStates'

const states: { [title: string]: State.WalletIdentity[] } = {
  'Empty List': [],
  'Content List': [
    {
      id: '1',
      name: 'Wallet 1',
    },
    {
      id: '2',
      name: 'Wallet 2',
    },
  ],
}

const stories = storiesOf('WalletSetting', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, wallets]) => {
  stories.add(title, () => (
    <WalletSetting
      {...initStates}
      wallet={{ ...initStates.wallet, id: wallets.length ? wallets[0].id : '' }}
      settings={{ ...initStates.settings, wallets }}
      dispatch={() => {}}
    />
  ))
})
