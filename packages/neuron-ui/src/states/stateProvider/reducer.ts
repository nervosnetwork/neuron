import produce, { Draft } from 'immer'
import initStates from 'states/init'
import { ConnectionStatus, ErrorCode } from 'utils'

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
  SetGlobalDialog = 'setGlobalDialog',
  AddNotification = 'addNotification',
  DismissNotification = 'dismissNotification',
  ClearNotificationsOfCode = 'clearNotificationsOfCode',
  ClearNotifications = 'clearNotifications',
  CleanTransaction = 'cleanTransaction',
  CleanTransactions = 'cleanTransactions',
  RequestPassword = 'requestPassword',
  DismissPasswordRequest = 'dismissPasswordRequest',
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

export type StateAction =
  | { type: AppActions.AddSendOutput }
  | { type: AppActions.RemoveSendOutput; payload: number }
  | { type: AppActions.UpdateSendOutput; payload: { idx: number; item: Partial<State.Output> } }
  | { type: AppActions.UpdateSendPrice; payload: string }
  | { type: AppActions.UpdateSendDescription; payload: string }
  | { type: AppActions.UpdateGeneratedTx; payload: any }
  | { type: AppActions.ClearSendState }
  | { type: AppActions.UpdateMessage; payload: any }
  | { type: AppActions.SetGlobalDialog; payload: 'unlock-success' | null }
  | { type: AppActions.AddNotification; payload: State.Message }
  | { type: AppActions.DismissNotification; payload: number } // payload: timestamp
  | { type: AppActions.ClearNotificationsOfCode; payload: ErrorCode } // payload: code
  | { type: AppActions.ClearNotifications }
  | { type: AppActions.CleanTransaction }
  | { type: AppActions.CleanTransactions }
  | { type: AppActions.RequestPassword; payload: Omit<State.PasswordRequest, 'password'> }
  | { type: AppActions.DismissPasswordRequest }
  | { type: AppActions.UpdateChainInfo; payload: Partial<State.App> }
  | { type: AppActions.UpdateLoadings; payload: any }
  | { type: AppActions.UpdateAlertDialog; payload: State.AlertDialog }
  | { type: AppActions.PopIn; payload: State.Popup }
  | { type: AppActions.PopOut }
  | { type: AppActions.ToggleTopAlertVisibility; payload?: boolean }
  | { type: AppActions.ToggleAllNotificationVisibility; payload?: boolean }
  | { type: AppActions.ToggleIsAllowedToFetchList; payload?: boolean }
  | { type: AppActions.Ignore; payload?: any }
  | { type: NeuronWalletActions.InitAppState; payload: any }
  | { type: NeuronWalletActions.UpdateCurrentWallet; payload: Partial<State.Wallet> }
  | { type: NeuronWalletActions.UpdateWalletList; payload: State.WalletIdentity[] }
  | { type: NeuronWalletActions.UpdateAddressListAndBalance; payload: Partial<State.Wallet> }
  | { type: NeuronWalletActions.UpdateAddressDescription; payload: { address: string; description: string } }
  | { type: NeuronWalletActions.UpdateTransactionList; payload: any }
  | { type: NeuronWalletActions.UpdateTransactionDescription; payload: { hash: string; description: string } }
  | { type: NeuronWalletActions.UpdateNetworkList; payload: State.Network[] }
  | { type: NeuronWalletActions.UpdateCurrentNetworkID; payload: string }
  | { type: NeuronWalletActions.UpdateConnectionStatus; payload: State.ConnectionStatus }
  | { type: NeuronWalletActions.UpdateSyncedBlockNumber; payload: string }
  | { type: NeuronWalletActions.UpdateNervosDaoData; payload: State.NervosDAO }
  | { type: NeuronWalletActions.UpdateAppUpdaterStatus; payload: State.AppUpdater }

export type StateDispatch = React.Dispatch<StateAction> // TODO: add type of payload

/* eslint-disable no-param-reassign */
export const reducer = produce((state: Draft<State.AppWithNeuronWallet>, action: StateAction) => {
  switch (action.type) {
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
      } = action.payload
      state.wallet = incomingWallet || state.wallet
      Object.assign(state.chain, {
        networkID,
        transactions,
        connectionStatus: connectionStatus ? ConnectionStatus.Online : ConnectionStatus.Connecting,
        tipBlockNumber: syncedBlockNumber,
      })
      Object.assign(state.settings, { networks, wallets })
      state.updater = {
        checking: false,
        downloadProgress: -1,
        version: '',
        releaseNotes: '',
      }
      break
    }
    case NeuronWalletActions.UpdateAddressListAndBalance:
    case NeuronWalletActions.UpdateCurrentWallet: {
      Object.assign(state.wallet, action.payload)
      break
    }
    case NeuronWalletActions.UpdateWalletList: {
      state.settings.wallets = action.payload
      break
    }
    case NeuronWalletActions.UpdateAddressDescription: {
      state.wallet.addresses.forEach(addr => {
        if (addr.address === action.payload.address) {
          addr.description = action.payload.description
        }
      })
      break
    }
    case NeuronWalletActions.UpdateTransactionList: {
      state.chain.transactions = action.payload
      break
    }
    case NeuronWalletActions.UpdateTransactionDescription: {
      state.chain.transactions.items.forEach(tx => {
        if (tx.hash === action.payload.hash) {
          tx.description = action.payload.description
        }
      })
      break
    }
    case NeuronWalletActions.UpdateNetworkList: {
      state.settings.networks = action.payload
      break
    }
    case NeuronWalletActions.UpdateCurrentNetworkID: {
      Object.assign(state.app, {
        tipBlockNumber: '0',
        chain: '',
        difficulty: BigInt(0),
        epoch: '',
      })
      state.chain.networkID = action.payload
      break
    }
    case NeuronWalletActions.UpdateConnectionStatus: {
      state.chain.connectionStatus = action.payload
      break
    }
    case NeuronWalletActions.UpdateSyncedBlockNumber: {
      state.chain.tipBlockNumber = action.payload
      break
    }
    case NeuronWalletActions.UpdateAppUpdaterStatus: {
      state.updater = action.payload
      break
    }
    case NeuronWalletActions.UpdateNervosDaoData: {
      state.nervosDAO = action.payload as Draft<typeof initStates.nervosDAO>
      break
    }
    // Actions of App
    case AppActions.UpdateChainInfo: {
      Object.assign(state.app, action.payload)
      break
    }
    case AppActions.AddSendOutput: {
      state.app.send.outputs.push(initStates.app.send.outputs[0])
      state.app.messages.send = null
      break
    }
    case AppActions.RemoveSendOutput: {
      state.app.send.outputs.splice(action.payload, 1)
      state.app.messages.send = null
      break
    }
    case AppActions.UpdateSendOutput: {
      /**
       * payload:{ idx, item: { address, capacity, date } }
       */
      if ('address' in action.payload.item) {
        Object.assign(state.app.send.outputs[action.payload.idx], { date: undefined })
      }
      Object.assign(state.app.send.outputs[action.payload.idx], action.payload.item)
      state.app.messages.send = null
      break
    }
    case AppActions.UpdateSendPrice: {
      /**
       * payload: new price
       */
      state.app.send.price = action.payload
      break
    }
    case AppActions.UpdateSendDescription: {
      /**
       * payload: new description
       */
      state.app.send.description = action.payload
      break
    }
    case AppActions.UpdateGeneratedTx: {
      state.app.send.generatedTx = action.payload || null
      break
    }
    case AppActions.ClearSendState: {
      state.app.send = initStates.app.send as Draft<typeof initStates.app.send>
      break
    }
    case AppActions.RequestPassword: {
      state.app.passwordRequest = action.payload
      break
    }
    case AppActions.DismissPasswordRequest: {
      state.app.passwordRequest = initStates.app.passwordRequest
      break
    }
    case AppActions.UpdateMessage: {
      /**
       * payload: {type,content, timestamp}
       */
      Object.assign(state.app.messages, action.payload)
      break
    }
    case AppActions.SetGlobalDialog: {
      state.app.globalDialog = action.payload
      break
    }
    case AppActions.AddNotification: {
      /**
       * payload: { type, content }
       */
      // NOTICE: for simplicty, only one notification will be displayed
      state.app.notifications.push(action.payload)
      state.app.showTopAlert = true
      break
    }
    case AppActions.DismissNotification: {
      /**
       * payload: timstamp
       */
      state.app.showTopAlert =
        state.app.notifications.findIndex(message => message.timestamp === action.payload) ===
        state.app.notifications.length - 1
          ? false
          : state.app.showTopAlert
      state.app.notifications = state.app.notifications.filter(({ timestamp }) => timestamp !== action.payload)
      state.app.showAllNotifications = state.app.showAllNotifications
        ? state.app.notifications.length > 0
        : state.app.showAllNotifications
      break
    }
    case AppActions.ClearNotificationsOfCode: {
      const notifications = state.app.notifications.filter(({ code }) => code !== action.payload)
      const showTopAlert =
        state.app.showTopAlert &&
        notifications.length > 0 &&
        !(
          state.app.notifications.length > 0 &&
          state.app.notifications[state.app.notifications.length - 1].code === action.payload
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
      state.chain.transactions = initStates.chain.transactions as Draft<typeof initStates.chain.transactions>
      break
    }
    case AppActions.UpdateLoadings: {
      Object.assign(state.app.loadings, action.payload)
      break
    }
    case AppActions.UpdateAlertDialog: {
      state.app.alertDialog = action.payload
      break
    }
    case AppActions.PopIn: {
      state.app.popups.push(action.payload)
      break
    }
    case AppActions.PopOut: {
      state.app.popups.shift()
      break
    }
    case AppActions.ToggleTopAlertVisibility: {
      state.app.showTopAlert = action.payload === undefined ? !state.app.showTopAlert : action.payload
      if (!state.app.showTopAlert) {
        state.app.notifications.pop()
      }
      break
    }
    case AppActions.ToggleAllNotificationVisibility: {
      state.app.showAllNotifications = action.payload === undefined ? !state.app.showAllNotifications : action.payload
      break
    }
    case AppActions.ToggleIsAllowedToFetchList: {
      state.app.isAllowedToFetchList = action.payload === undefined ? !state.app.isAllowedToFetchList : action.payload
      break
    }
    default: {
      break
    }
  }
})
