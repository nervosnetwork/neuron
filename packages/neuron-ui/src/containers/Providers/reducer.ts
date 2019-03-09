import { initChain } from '../../contexts/Chain'
import { initWallet } from '../../contexts/Wallet'
import { initSettings } from '../../contexts/Settings'

export enum ProviderActions {
  Chain,
  Wallet,
  Settings,
}

export const initProviders = {
  chain: initChain,
  wallet: initWallet,
  settings: initSettings,
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
    default: {
      return state
    }
  }
}
