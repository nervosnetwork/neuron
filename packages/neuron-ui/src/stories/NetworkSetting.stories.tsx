import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import NetworkSetting from 'components/NetworkSetting'
import initStates from 'states/initStates'

const states: { [title: string]: State.Network[] } = {
  'Empty List': [],
  'Content List': [
    {
      id: 'Testnet',
      name: 'Testnet',
      remote: 'http://localhost:8114',
    },
    {
      id: 'Local',
      name: 'Local',
      remote: 'http://localhost:8114',
    },
  ],
}

const NetworkSettingWithRouteProps = ({ networks }: { networks: State.Network[] }) => (
  <Route
    path="/"
    render={(props: RouteComponentProps) => (
      <NetworkSetting
        {...props}
        {...initStates}
        chain={{ ...initStates.chain, networkID: networks.length ? networks[0].id : '' }}
        settings={{ ...initStates.settings, networks }}
        dispatch={() => {}}
      />
    )}
  />
)

const stories = storiesOf('NetworkSetting', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, list]) => {
  stories.add(title, () => <NetworkSettingWithRouteProps networks={list} />)
})
