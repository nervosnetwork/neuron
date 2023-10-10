import { Meta, StoryObj } from '@storybook/react'
import Navbar from 'containers/Navbar'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'

const wallets: State.WalletIdentity[] = [{ id: 'wallet id', name: 'wallet name' }]

const meta: Meta<typeof Navbar> = {
  component: Navbar,
  decorators: [withRouter],
  argTypes: {
    wallet: { control: 'object', isGlobal: true },
    settings: { control: 'object', isGlobal: true },
  },
}

export default meta

type Story = StoryObj<typeof Navbar>

export const Default: Story = {
  args: {
    wallet: { ...initStates.wallet, id: 'wallet id', name: '中文钱包的名字最多可以达到二十个中文字符' },
    settings: { ...initStates.settings, wallets },
  },
}
