import { Meta, StoryObj } from '@storybook/react'
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

const meta: Meta<typeof WalletSetting> = {
  component: WalletSetting,
  decorators: [withRouter],
  args: {
    dispatch: () => {},
  },
}

export default meta

type Story = StoryObj<typeof WalletSetting>

const getArgs = (wallets: State.WalletIdentity[]) => {
  return {
    ...initStates,
    wallet: { ...initStates.wallet, id: wallets.length ? wallets[0].id : '' },
    settings: { ...initStates.settings, wallets },
  }
}

export const EmptyList: Story = {
  args: getArgs(states['Empty List']),
}

export const ContentList: Story = {
  args: getArgs(states['Content List']),
}
