import React from 'react'
import { ComponentStory } from '@storybook/react'
import Navbar from 'containers/Navbar'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'

const wallets: State.WalletIdentity[] = [{ id: 'wallet id', name: 'wallet name' }]

export default {
  title: 'Navbar',
  component: Navbar,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
    settings: { control: 'object', isGlobal: true },
  },
}

export const Basic: ComponentStory<typeof Navbar> = () => <Navbar />
Basic.args = {
  wallet: { ...initStates.wallet, id: 'wallet id', name: '中文钱包的名字最多可以达到二十个中文字符' },
  settings: { ...initStates.settings, wallets },
}
