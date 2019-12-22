import { NeuronWalletActions, AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { getNeuronWalletState } from 'services/remote'
import initStates from 'states/initStates'
import { Routes, ErrorCode } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import { addressesToBalance } from 'utils/formatters'
import {
  wallets as walletsCache,
  addresses as addressesCache,
  currentWallet as currentWalletCache,
  currentNetworkID as currentNetworkIDCache,
  networks as networksCache,
} from 'services/localCache'

export const initAppState = () => (dispatch: StateDispatch, history: any) => {
  getNeuronWalletState()
    .then(res => {
      if (res.status === 1) {
        const {
          wallets = [],
          currentWallet: wallet = initStates.wallet,
          addresses = [],
          transactions = initStates.chain.transactions,
          networks = [],
          currentNetworkID = '',
          syncedBlockNumber = '',
          connectionStatus = false,
        } = res.result
        dispatch({
          type: NeuronWalletActions.InitAppState,
          payload: {
            wallet: { ...wallet, balance: addressesToBalance(addresses), addresses },
            wallets,
            transactions,
            networks,
            currentNetworkID,
            syncedBlockNumber,
            connectionStatus,
          },
        })
        if (!wallet) {
          history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
        } else {
          history.push(Routes.Overview)
        }

        currentWalletCache.save(wallet)
        walletsCache.save(wallets)
        addressesCache.save(addresses)
        networksCache.save(networks)
        currentNetworkIDCache.save(currentNetworkID)
      } else {
        history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
      }
    })
    .catch(() => {
      history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
    })
}

// text: an i18n key under `messages`
export const addPopup = (text: string) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.PopIn,
    payload: { text: `messages.${text}`, timestamp: Date.now() },
  })
  setTimeout(() => {
    dispatch({
      type: AppActions.PopOut,
      payload: null,
    })
  }, 8000)
}

export const addNotification = (message: State.Message<ErrorCode>) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.AddNotification,
    payload: message,
  })
}

export const dismissNotification = (timestamp: number) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.DismissNotification,
    payload: timestamp,
  })
}

export const showAlertDialog = (content: { title: string; message: string }) => (
  dispatch: React.Dispatch<{ type: AppActions.UpdateAlertDialog; payload: { title: string; message: string } }>
) => {
  dispatch({
    type: AppActions.UpdateAlertDialog,
    payload: content,
  })
}

export const dismissAlertDialog = () => (
  dispatch: React.Dispatch<{ type: AppActions.UpdateAlertDialog; payload: null }>
) => {
  dispatch({
    type: AppActions.UpdateAlertDialog,
    payload: null,
  })
}

export const toggleTopAlertVisibility = (show?: boolean) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ToggleTopAlertVisibility,
    payload: show,
  })
}

export const toggleAllNotificationVisibility = (show?: boolean) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ToggleAllNotificationVisibility,
    payload: show,
  })
}

export const toggleIsAllowedToFetchList = (allowed?: boolean) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ToggleIsAllowedToFetchList,
    payload: allowed,
  })
}

export default {
  initAppState,
  addNotification,
  addPopup,
  dismissNotification,
  showAlertDialog,
  dismissAlertDialog,
  toggleTopAlertVisibility,
  toggleAllNotificationVisibility,
  toggleIsAllowedToFetchList,
}
