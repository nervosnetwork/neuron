import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
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

const WalletSettingWithRouteProps = ({ wallets }: { wallets: State.WalletIdentity[] }) => (
  <Route
    path="/"
    render={(props: RouteComponentProps) => (
      <WalletSetting
        {...props}
        {...initStates}
        wallet={{ ...initStates.wallet, id: wallets.length ? wallets[0].id : '' }}
        settings={{ ...initStates.settings, wallets }}
        dispatch={() => {}}
      />
    )}
  />
)

const stories = storiesOf('WalletSetting', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, list]) => {
  stories.add(title, () => <WalletSettingWithRouteProps wallets={list} />)
})
