import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import WalletSetting from 'components/WalletSetting'
import { initStates } from 'states'

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

const stories = storiesOf('WalletSetting', module).addDecorator(withRouter())

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
