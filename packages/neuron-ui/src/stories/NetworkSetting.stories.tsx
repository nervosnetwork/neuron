import { Meta, StoryObj } from '@storybook/react'
import NetworkSetting from 'components/NetworkSetting'
import { initStates } from 'states'
import { withRouter } from 'storybook-addon-react-router-v6'

const states: { [title: string]: State.Network[] } = {
  EmptyList: [],
  ContentList: [
    {
      id: 'Mainnet',
      name: 'Mainnet',
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb',
      type: 0,
      genesisHash: '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5',
      readonly: true,
    },
    {
      id: 'Testnet',
      name: 'Testnet',
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb_testnet',
      type: 1,
      genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
      readonly: false,
    },
    {
      id: 'Local',
      name: 'Local',
      remote: 'http://127.0.0.1:8114',
      chain: 'ckb_devnet',
      type: 1,
      genesisHash: '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606',
      readonly: false,
    },
  ],
}

const meta: Meta<typeof NetworkSetting> = {
  component: NetworkSetting,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof NetworkSetting>

function getArgs(networks: State.Network[] = []) {
  return {
    ...initStates,
    chain: { ...initStates.chain, networkID: networks.length ? networks[0].id : '' },
    settings: { ...initStates.settings, networks },
  }
}
export const EmptyList: Story = {
  args: getArgs(states.EmptyList),
}

export const ContentList: Story = {
  args: getArgs(states.ContentList),
}
