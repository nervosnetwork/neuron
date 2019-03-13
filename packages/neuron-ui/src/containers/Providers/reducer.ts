import { initChain } from '../../contexts/Chain'
import { initWallet } from '../../contexts/Wallet'
import { initSettings } from '../../contexts/Settings'
import { initWallets } from '../../contexts/Wallets'

export enum ProviderActions {
  Chain,
  Wallet,
  Settings,
  Wallets,
}

export const initProviders = {
  chain: initChain,
  wallet: initWallet,
  settings: initSettings,
  wallets: initWallets,
}

export type ProviderDispatch = React.Dispatch<{ type: ProviderActions; payload: typeof initProviders }>

export const reducer = (state: typeof initProviders, action: { type: ProviderActions; payload: any }) => {
  switch (action.type) {
    case ProviderActions.Settings: {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      }
    }
    case ProviderActions.Wallet: {
      return {
        ...state,
        wallet: {
          ...state.wallet,
          ...action.payload,
        },
      }
    }
    case ProviderActions.Chain: {
      return {
        ...state,
        chain: {
          ...state.chain,
          ...action.payload,
        },
      }
    }
    case ProviderActions.Wallets: {
      return {
        ...state,
        wallets: {
          ...state.wallets,
          ...action.payload,
        },
      }
    }
    default: {
      return state
    }
  }
}
