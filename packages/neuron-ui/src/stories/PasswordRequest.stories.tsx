import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { withRouter } from 'storybook-addon-react-router-v6'
import PasswordRequest from 'components/PasswordRequest'
import { initStates, NeuronWalletContext } from 'states'

const dispatch = action('Dispatch')

const states: { [title: string]: State.AppWithNeuronWallet } = {
  WalletNotFound: {
    ...initStates,
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  EmptyPasswordOfDeleteWallet: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  ContentPasswordOfDeleteWallet: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'delete',
      },
    },
  },
  EmptyPasswordOfBackupWallet: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'backup',
      },
    },
  },
  ContentPasswordOfBackupWallet: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'backup',
      },
    },
  },
  EmptyPasswordOfUnlock: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'unlock',
      },
    },
  },
  SendTransaction: {
    ...initStates,
    settings: {
      ...initStates.settings,
      wallets: [{ id: '1', name: 'test wallet', extendedKey: '' }],
    },
    app: {
      ...initStates.app,
      passwordRequest: {
        walletID: '1',
        actionType: 'send',
      },
    },
  },
}

const meta: Meta<State.AppWithNeuronWallet> = {
  component: PasswordRequest,
  decorators: [
    withRouter(),
    (Component, { args }) => (
      <NeuronWalletContext.Provider value={{ state: args, dispatch }}>
        <Component />
      </NeuronWalletContext.Provider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof PasswordRequest>

export const WalletNotFound: Story = {
  args: states.WalletNotFound,
}

export const EmptyPasswordOfDeleteWallet: Story = {
  args: states.EmptyPasswordOfDeleteWallet,
}

export const ContentPasswordOfDeleteWallet: Story = {
  args: states.ContentPasswordOfDeleteWallet,
}

export const EmptyPasswordOfBackupWallet: Story = {
  args: states.EmptyPasswordOfBackupWallet,
}

export const ContentPasswordOfBackupWallet: Story = {
  args: states.ContentPasswordOfBackupWallet,
}

export const EmptyPasswordOfUnlock: Story = {
  args: states.EmptyPasswordOfUnlock,
}

export const SendTransaction: Story = {
  args: states.SendTransaction,
}
