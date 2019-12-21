import produce from 'immer'
import initStates from 'states/initStates'
import { ConnectionStatus } from '../../utils/const'

export enum NeuronWalletActions {
  InitAppState = 'initAppState',
  // wallets
  UpdateCurrentWallet = 'updateCurrentWallet',
  UpdateWalletList = 'updateWalletList',
  UpdateAddressListAndBalance = 'updateAddressListAndBalance',
  UpdateAddressDescription = 'updateAddressDescription',
  // transactions
  UpdateTransactionList = 'updateTransactionList',
  UpdateTransactionDescription = 'updateTransactionDescription',
  // networks
  UpdateNetworkList = 'updateNetworkList',
  UpdateCurrentNetworkID = 'updateCurrentNetworkID',
  // Connection
  UpdateConnectionStatus = 'updateConnectionStatus',
  UpdateSyncedBlockNumber = 'updateSyncedBlockNumber',
  // dao
  UpdateNervosDaoData = 'updateNervosDaoData',
  // updater
  UpdateAppUpdaterStatus = 'updateAppUpdaterStatus',
}
export enum AppActions {
  AddSendOutput = 'addSendOutput',
  RemoveSendOutput = 'removeSendOutput',
  UpdateSendOutput = 'updateSendOutput',
  UpdateSendPrice = 'updateSendPrice',
  UpdateSendDescription = 'updateSendDescription',
  UpdateGeneratedTx = 'updateGeneratedTx',
  ClearSendState = 'clearSendState',
  UpdateMessage = 'updateMessage',
  AddNotification = 'addNotification',
  DismissNotification = 'dismissNotification',
  ClearNotificationsOfCode = 'clearNotificationsOfCode',
  ClearNotifications = 'clearNotifications',
  CleanTransaction = 'cleanTransaction',
  CleanTransactions = 'cleanTransactions',
  RequestPassword = 'requestPassword',
  DismissPasswordRequest = 'dismissPasswordRequest',
  UpdatePassword = 'updatePassword',
  UpdateChainInfo = 'updateChainInfo',
  UpdateLoadings = 'updateLoadings',
  UpdateAlertDialog = 'updateAlertDialog',

  PopIn = 'popIn',
  PopOut = 'popOut',
  ToggleTopAlertVisibility = 'toggleTopAlertVisibility',
  ToggleAllNotificationVisibility = 'toggleAllNotificationVisibility',
  ToggleIsAllowedToFetchList = 'toggleIsAllowedToFetchList',
  Ignore = 'ignore',
}

export type StateActions = NeuronWalletActions | AppActions

export type StateDispatch = React.Dispatch<{ type: StateActions; payload: any }> // TODO: add type of payload
export type StateWithDispatch = State.AppWithNeuronWallet & { dispatch: StateDispatch }

<<<<<<< HEAD
export const reducer = (
  state: State.AppWithNeuronWallet,
  { type, payload }: { type: StateActions; payload: any }
): State.AppWithNeuronWallet => {
  const { app, wallet, settings, chain } = state
  if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('log-action')) {
    console.group(`type: ${type}`)
    console.info(payload)
    console.groupEnd()
  }
  switch (type) {
    // Actions of Neuron Wallet
    case NeuronWalletActions.InitAppState: {
      const {
        wallets,
        wallet: incomingWallet,
        networks,
        currentNetworkID: networkID,
        transactions,
        syncedBlockNumber,
        connectionStatus,
      } = payload
      return {
        ...state,
        wallet: incomingWallet || wallet,
        chain: {
          ...state.chain,
=======
/* eslint-disable no-param-reassign */
export const reducer = produce(
  (
    state: State.AppWithNeuronWallet,
    { type, payload }: { type: StateActions; payload: any }
  ): State.AppWithNeuronWallet => {
    const { app } = state
    if (process.env.NODE_ENV === 'development' && window.localStorage.getItem('log-action')) {
      console.group(`type: ${type}`)
      console.info(payload)
      console.groupEnd()
    }
    switch (type) {
      // Actions of Neuron Wallet
      case NeuronWalletActions.InitAppState: {
        const {
          wallets,
          wallet: incomingWallet,
          networks,
          currentNetworkID: networkID,
          transactions,
          syncedBlockNumber,
          connectionStatus,
          codeHash,
        } = payload
        state.wallet = incomingWallet || state.wallet
        Object.assign(state.chain, {
>>>>>>> 9ec3c634... refactor: use immer to simplify reducer
          networkID,
          transactions,
          connectionStatus: connectionStatus ? ConnectionStatus.Online : ConnectionStatus.Offline,
          tipBlockNumber: syncedBlockNumber,
        })
        Object.assign(state.settings, { networks, wallets })
        state.updater = {
          checking: false,
          downloadProgress: -1,
          version: '',
          releaseNotes: '',
<<<<<<< HEAD
        },
      }
    }
    case NeuronWalletActions.UpdateCurrentWallet: {
      return {
        ...state,
        wallet: {
          ...wallet,
          ...payload,
        },
      }
    }
    case NeuronWalletActions.UpdateWalletList: {
      return {
        ...state,
        settings: {
          ...settings,
          wallets: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateAddressDescription: {
      /**
       * payload:{
       *   address: string
       *   description: string
       * }
       */
      return {
        ...state,
        wallet: {
          ...wallet,
          addresses: wallet.addresses.map(addr =>
            addr.address === payload.address ? { ...addr, description: payload.description } : addr
          ),
        },
      }
    }
    case NeuronWalletActions.UpdateAddressListAndBalance: {
      return {
        ...state,
        wallet: {
          ...wallet,
          ...payload,
        },
      }
    }
    case NeuronWalletActions.UpdateTransactionList: {
      return {
        ...state,
        chain: {
          ...chain,
          transactions: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateTransactionDescription: {
      /**
       * payload: {
       *   hash: string,
       *   description: string
       * }
       */
      return {
        ...state,
        chain: {
          ...chain,
          transactions: {
            ...chain.transactions,
            items: chain.transactions.items.map(tx =>
              tx.hash === payload.hash ? { ...tx, description: payload.description } : tx
            ),
          },
        },
      }
    }
    case NeuronWalletActions.UpdateNetworkList: {
      return {
        ...state,
        settings: {
          ...settings,
          networks: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateCurrentNetworkID: {
      return {
        ...state,
        app: {
          ...app,
=======
        }
        break
      }
      case NeuronWalletActions.UpdateCodeHash: {
        state.chain.codeHash = payload
        break
      }
      case NeuronWalletActions.UpdateAddressListAndBalance:
      case NeuronWalletActions.UpdateCurrentWallet: {
        Object.assign(state.wallet, payload)
        break
      }
      case NeuronWalletActions.UpdateWalletList: {
        state.settings.wallets = payload
        break
      }
      case NeuronWalletActions.UpdateAddressDescription: {
        state.wallet.addresses.forEach(addr => {
          if (addr.address === payload.address) {
            addr.description = payload.description
          }
        })
        break
      }
      case NeuronWalletActions.UpdateTransactionList: {
        state.chain.transactions = payload
        break
      }
      case NeuronWalletActions.UpdateTransactionDescription: {
        state.chain.transactions.items.forEach(tx => {
          if (tx.hash === payload.hash) {
            tx.description = payload.description
          }
        })
        break
      }
      case NeuronWalletActions.UpdateNetworkList: {
        state.settings.networks = payload
        break
      }
      case NeuronWalletActions.UpdateCurrentNetworkID: {
        Object.assign(state.app, {
>>>>>>> 9ec3c634... refactor: use immer to simplify reducer
          tipBlockNumber: '0',
          chain: '',
          difficulty: BigInt(0),
          epoch: '',
        })
        state.chain.networkID = payload
        break
      }
      case NeuronWalletActions.UpdateConnectionStatus: {
        state.chain.connectionStatus = payload
        break
      }
      case NeuronWalletActions.UpdateSyncedBlockNumber: {
        state.chain.tipBlockNumber = payload
        break
      }
      case NeuronWalletActions.UpdateAppUpdaterStatus: {
        state.updater = payload
        break
      }
      case NeuronWalletActions.UpdateNervosDaoData: {
        state.nervosDAO = payload
        break
      }
      // Actions of App
      case AppActions.UpdateChainInfo: {
        Object.assign(state.app, payload)
        break
      }
      case AppActions.AddSendOutput: {
        state.app.send.outputs.push(initStates.app.send.outputs[0])
        state.app.messages.send = null
        break
      }
      case AppActions.RemoveSendOutput: {
        state.app.send.outputs.splice(payload, 1)
        state.app.messages.send = null
        break
      }
      case AppActions.UpdateSendOutput: {
        /**
         * payload:{ idx, item: { address, capacity } }
         */
        Object.assign(state.app.send.outputs[payload.idx], payload.item)
        state.app.messages.send = null
        break
      }
      case AppActions.UpdateSendPrice: {
        /**
         * payload: new price
         */
        state.app.send.price = payload
        break
      }
      case AppActions.UpdateSendDescription: {
        /**
         * payload: new description
         */
        state.app.send.description = payload
        break
      }
      case AppActions.UpdateGeneratedTx: {
        state.app.send.generatedTx = payload || null
        break
      }
      case AppActions.ClearSendState: {
        state.app.send = initStates.app.send
        break
      }
      case AppActions.RequestPassword: {
        state.app.passwordRequest = payload
        break
      }
      case AppActions.DismissPasswordRequest: {
        state.app.passwordRequest = initStates.app.passwordRequest
        break
      }
      case AppActions.UpdatePassword: {
        state.app.passwordRequest.password = payload
        break
      }
      case AppActions.UpdateMessage: {
        /**
         * payload: {type,content, timestamp}
         */
        Object.assign(state.app.messages, payload)
        break
      }
      case AppActions.AddNotification: {
        /**
         * payload: { type, content }
         */
        // NOTICE: for simplicty, only one notification will be displayed
        state.app.notifications.push(payload)
        state.app.showTopAlert = true
        break
      }
      case AppActions.DismissNotification: {
        /**
         * payload: timstamp
         */
        state.app.showTopAlert =
          app.notifications.findIndex(message => message.timestamp === payload) === app.notifications.length - 1
            ? false
            : app.showTopAlert
        state.app.notifications = state.app.notifications.filter(({ timestamp }) => timestamp !== payload)
        state.app.showAllNotifications = state.app.notifications.length > 1
        break
      }
      case AppActions.ClearNotificationsOfCode: {
        const notifications = state.app.notifications.filter(({ code }) => code !== payload)
        const showTopAlert =
          state.app.showTopAlert &&
          notifications.length > 0 &&
          !(
            state.app.notifications.length > 0 &&
            state.app.notifications[state.app.notifications.length - 1].code === payload
          )
        state.app.notifications = notifications
        state.app.showTopAlert = showTopAlert
        break
      }
      case AppActions.ClearNotifications: {
        state.app.notifications = []
        break
      }
      case AppActions.CleanTransactions: {
        state.chain.transactions = initStates.chain.transactions
        break
      }
      case AppActions.UpdateLoadings: {
        Object.assign(state.app.loadings, payload)
        break
      }
      case AppActions.UpdateAlertDialog: {
        state.app.alertDialog = payload
        break
      }
      case AppActions.PopIn: {
        state.app.popups.push(payload)
        break
      }
      case AppActions.PopOut: {
        state.app.popups.shift()
        break
      }
      case AppActions.ToggleTopAlertVisibility: {
        state.app.showTopAlert = payload === undefined ? !state.app.showTopAlert : payload
        if (!state.app.showTopAlert) {
          state.app.notifications.pop()
        }
        break
      }
      case AppActions.ToggleAllNotificationVisibility: {
        state.app.showAllNotifications = payload === undefined ? !app.showAllNotifications : payload
        break
      }
      case AppActions.ToggleIsAllowedToFetchList: {
        state.app.isAllowedToFetchList = payload === undefined ? !app.isAllowedToFetchList : payload
        break
      }
      default: {
        break
      }
    }
    return state
  }
)
