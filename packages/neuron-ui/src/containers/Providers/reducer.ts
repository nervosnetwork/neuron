import emptyWalletState from 'contexts/NeuronWallet/wallet'
import { initNeuronWallet } from 'contexts/NeuronWallet'

export enum ProviderActions {
  Initiate = 'initiate',
  Chain = 'chain',
  Wallet = 'wallet',
  Settings = 'settings',
  AddMessage = 'addMessage',
  DismissMessage = 'dismissMessage',
  CleanTransaction = 'cleanTransaction',
  CleanTransactions = 'cleanTransactions',
}

export const initProviders = initNeuronWallet

export type ProviderDispatch = React.Dispatch<{ type: ProviderActions; payload: typeof initProviders }>

export const reducer = (state: typeof initProviders, action: { type: ProviderActions; payload: any }) => {
  switch (action.type) {
    case ProviderActions.Initiate: {
      const { networks, networkId, wallets, wallet } = action.payload
      return {
        ...state,
        wallet: wallet || state.wallet,
        chain: {
          ...state.chain,
          networkId,
        },
        settings: {
          ...state.settings,
          wallets,
          networks,
        },
      }
    }
    case ProviderActions.Wallet: {
      if (!action.payload) {
        return {
          ...state,
          wallet: emptyWalletState,
        }
      }
      return {
        ...state,
        wallet: {
          ...state.wallet,
          ...action.payload,
        },
      }
    }
    case ProviderActions.Settings:
    case ProviderActions.Chain: {
      if (action.payload.toggleAddressBook) {
        return {
          ...state,
          settings: {
            ...state.settings,
            showAddressBook: !state.settings.showAddressBook,
          },
        }
      }
      return {
        ...state,
        [action.type]: {
          ...state[action.type],
          ...action.payload,
        },
      }
    }
    case ProviderActions.CleanTransaction: {
      return {
        ...state,
        chain: {
          ...state.chain,
          transaction: initNeuronWallet.chain.transaction,
        },
      }
    }
    case ProviderActions.AddMessage: {
      return {
        ...state,
        messages: [...state.messages, action.payload],
      }
    }
    case ProviderActions.DismissMessage: {
      return {
        ...state,
        messages: state.messages.filter(({ time }) => time !== action.payload),
      }
    }
    case ProviderActions.CleanTransactions: {
      return {
        ...state,
        chain: {
          ...state.chain,
          transactions: initNeuronWallet.chain.transactions,
        },
      }
    }
    default: {
      return state
    }
  }
}
