import { NeuronWalletActions, AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { getNeuronWalletState } from 'services/remote'
import initStates from 'states/initStates'
import { Routes } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import addressesToBalance from 'utils/addressesToBalance'
import {
  wallets as walletsCache,
  addresses as addressesCache,
  currentWallet as currentWalletCache,
  currentNetworkID as currentNetworkIDCache,
  networks as networksCache,
} from 'utils/localCache'

export const initAppState = () => (dispatch: StateDispatch, history: any) => {
  dispatch({
    type: AppActions.UpdateLoadings,
    payload: {
      addressList: true,
      transactionList: true,
    },
  })
  getNeuronWalletState()
    .then(res => {
      if (res.status) {
        const {
          wallets = [],
          currentWallet: wallet = initStates.wallet,
          addresses = [],
          transactions = initStates.chain.transactions,
          networks = [],
          currentNetworkID = '',
          syncedBlockNumber = '',
          connectionStatus = false,
          codeHash = '',
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
            codeHash,
          },
        })
        if (!wallet) {
          history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
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
    .finally(() => {
      dispatch({
        type: AppActions.UpdateLoadings,
        payload: {
          addressList: false,
          transactionList: false,
        },
      })
    })
}

export const addNotification = ({ type, content }: { type: 'alert'; content: string }) => (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.AddNotification,
    payload: {
      type,
      content,
      timestamp: Date.now(),
    },
  })
}

export default {
  initAppState,
  addNotification,
}
