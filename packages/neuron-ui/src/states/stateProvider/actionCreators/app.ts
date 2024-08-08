import { NeuronWalletActions, AppActions, StateDispatch } from 'states/stateProvider/reducer'
import {
  getLockWindowInfo as getLockWindowInfoAPI,
  updateLockWindowInfo as updateLockWindowInfoAPI,
  getNeuronWalletState,
} from 'services/remote'
import initStates from 'states/init'
import { RoutePath, ErrorCode, addressesToBalance, isSuccessResponse } from 'utils'
import { WalletWizardPath } from 'components/WalletWizard'
import {
  wallets as walletsCache,
  addresses as addressesCache,
  currentWallet as currentWalletCache,
  currentNetworkID as currentNetworkIDCache,
  networks as networksCache,
  lastShowInternalNodeIds,
} from 'services/localCache'

export const initAppState = () => (dispatch: StateDispatch, navigate: any) => {
  getNeuronWalletState()
    .then(res => {
      if (isSuccessResponse(res)) {
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
          navigate(`${RoutePath.WalletWizard}${WalletWizardPath.Welcome}`)
        } else {
          navigate(RoutePath.Overview)
        }

        currentWalletCache.save(wallet)
        walletsCache.save(wallets)
        addressesCache.save(addresses)
        networksCache.save(networks)
        currentNetworkIDCache.save(currentNetworkID)
        const currentNetwork = (networks as State.Network[]).find(v => v.id === currentNetworkID)
        if (currentNetwork) {
          lastShowInternalNodeIds.save(currentNetwork.type, currentNetworkID)
        }
      } else {
        navigate(`${RoutePath.WalletWizard}${WalletWizardPath.Welcome}`)
      }
    })
    .catch(() => {
      navigate(`${RoutePath.WalletWizard}${WalletWizardPath.Welcome}`)
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
    })
  }, 8000)
}

export const addNotification = (message: State.Message<ErrorCode>) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.UpdateGlobalAlertDialog,
    payload: {
      type: ['success', 'failed'].includes(message.type) ? message.type : 'warning',
      message: message.content,
    } as State.GlobalAlertDialog,
  })
}

export const dismissGlobalDialog = () => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.SetGlobalDialog,
    payload: null,
  })
}

export const showGlobalAlertDialog =
  (content: State.GlobalAlertDialog) =>
  (dispatch: React.Dispatch<{ type: AppActions.UpdateGlobalAlertDialog; payload: State.GlobalAlertDialog }>) => {
    dispatch({
      type: AppActions.UpdateGlobalAlertDialog,
      payload: content,
    })
  }

export const dismissGlobalAlertDialog =
  () => (dispatch: React.Dispatch<{ type: AppActions.UpdateGlobalAlertDialog; payload: null }>) => {
    dispatch({
      type: AppActions.UpdateGlobalAlertDialog,
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

let timer: ReturnType<typeof setTimeout>
export const showPageNotice =
  (i18nKey: string, status: State.PageNotice['status'] = 'success') =>
  (dispatch: StateDispatch) => {
    clearTimeout(timer)
    dispatch({
      type: AppActions.SetPageNotice,
      payload: { i18nKey, status },
    })
    timer = setTimeout(() => {
      dispatch({
        type: AppActions.SetPageNotice,
        payload: undefined,
      })
    }, 2000)
  }

export const getLockWindowInfo = (dispatch: StateDispatch) => {
  return getLockWindowInfoAPI().then(res => {
    if (isSuccessResponse(res) && res.result) {
      dispatch({
        type: AppActions.SetLockWindowInfo,
        payload: res.result,
      })
    }
  })
}

export const updateLockWindowInfo = (params: { locked?: boolean; password?: string }) => (dispatch: StateDispatch) => {
  updateLockWindowInfoAPI(params).then(res => {
    if (isSuccessResponse(res) && res.result) {
      dispatch({
        type: AppActions.SetLockWindowInfo,
        payload: res.result,
      })
    }
  })
}
