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
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb',
      type: 0,
      genesisHash: '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5',
    },
    {
      id: 'Testnet',
      name: 'Testnet',
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb_testnet',
      type: 1,
      genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
    },
    {
      id: 'Local',
      name: 'Local',
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb_devnet',
      type: 1,
      genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
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
