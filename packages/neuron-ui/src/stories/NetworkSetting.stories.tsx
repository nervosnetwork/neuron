import React from 'react'
import { storiesOf } from '@storybook/react'
import NetworkSetting from 'components/NetworkSetting'
import { initStates } from 'states'
import { withRouter } from 'storybook-addon-react-router-v6'

const states: { [title: string]: State.Network[] } = {
  'Empty List': [],
  'Content List': [
    {
      id: 'Mainnet',
      name: 'Mainnet',
      remote: 'http://localhost:8114',
      chain: 'ckb',
      type: 0,
    },
    {
      id: 'Testnet',
      name: 'Testnet',
      remote: 'http://localhost:8114',
      chain: 'ckb_testnet',
      type: 1,
    },
    {
      id: 'Local',
      name: 'Local',
      remote: 'http://localhost:8114',
      chain: 'ckb_devnet',
      type: 1,
    },
  ],
}

const stories = storiesOf('NetworkSetting', module).addDecorator(withRouter())

Object.entries(states).forEach(([title, networks]) => {
  stories.add(title, () => (
    <NetworkSetting
      {...initStates}
      chain={{ ...initStates.chain, networkID: networks.length ? networks[0].id : '' }}
      settings={{ ...initStates.settings, networks }}
    />
  ))
})
