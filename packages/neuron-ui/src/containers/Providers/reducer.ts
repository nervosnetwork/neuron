import { initNeuronWallet } from '../../contexts/NeuronWallet'

export enum ProviderActions {
  Chain = 'chain',
  Wallet = 'wallet',
  Settings = 'settings',
  CleanTransaction = 'cleanTransaction',
  CleanTransactions = 'cleanTransactions',
}

export const initProviders = initNeuronWallet

export type ProviderDispatch = React.Dispatch<{ type: ProviderActions; payload: typeof initProviders }>

export const reducer = (state: typeof initProviders, action: { type: ProviderActions; payload: any }) => {
  switch (action.type) {
    case ProviderActions.Settings:
    case ProviderActions.Wallet:
    case ProviderActions.Chain: {
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
