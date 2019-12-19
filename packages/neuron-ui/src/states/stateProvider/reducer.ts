import initStates from 'states/initStates'
import { ConnectionStatus } from '../../utils/const'

export enum NeuronWalletActions {
  InitAppState = 'initAppState',
  UpdateCodeHash = 'updateCodeHash',
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
  UpdateTransactionID = 'updateTransactionID',
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
        codeHash,
      } = payload
      return {
        ...state,
        wallet: incomingWallet || wallet,
        chain: {
          ...state.chain,
          networkID,
          transactions,
          codeHash,
          connectionStatus: connectionStatus ? ConnectionStatus.Online : ConnectionStatus.Offline,
          tipBlockNumber: syncedBlockNumber,
        },
        settings: {
          general: {
            ...state.settings.general,
          },
          networks,
          wallets,
        },
        updater: {
          checking: false,
          downloadProgress: -1,
          version: '',
          releaseNotes: '',
        },
      }
    }
    case NeuronWalletActions.UpdateCodeHash: {
      return {
        ...state,
        chain: {
          ...chain,
          codeHash: payload,
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
          tipBlockNumber: '0',
          chain: '',
          difficulty: BigInt(0),
          epoch: '',
        },
        chain: {
          ...chain,
          networkID: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateConnectionStatus: {
      return {
        ...state,
        chain: {
          ...chain,
          connectionStatus: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateSyncedBlockNumber: {
      return {
        ...state,
        chain: {
          ...chain,
          tipBlockNumber: payload,
        },
      }
    }
    case NeuronWalletActions.UpdateAppUpdaterStatus: {
      return {
        ...state,
        updater: payload,
      }
    }
    case NeuronWalletActions.UpdateNervosDaoData: {
      return {
        ...state,
        nervosDAO: payload,
      }
    }
    // Actions of App
    case AppActions.UpdateChainInfo: {
      return {
        ...state,
        app: {
          ...app,
          ...payload,
        },
      }
    }
    case AppActions.UpdateTransactionID: {
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            txID: Math.round(Math.random() * 100000).toString(),
          },
        },
      }
    }
    case AppActions.AddSendOutput: {
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            outputs: [...app.send.outputs, initStates.app.send.outputs[0]],
          },
          messages: {
            ...app.messages,
            send: null,
          },
        },
      }
    }
    case AppActions.RemoveSendOutput: {
      /**
       * payload: index of the output to be removed
       */
      return {
        ...state,
        app: {
          ...app,
          send: { ...app.send, outputs: app.send.outputs.filter((_, idx) => idx !== payload) },
          messages: {
            ...app.messages,
            send: null,
          },
        },
      }
    }
    case AppActions.UpdateSendOutput: {
      /**
       * payload:{ idx, item: { address, capacity } }
       */
      const outputs = [...app.send.outputs]
      outputs[payload.idx] = {
        ...outputs[payload.idx],
        ...payload.item,
      }
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            outputs,
          },
          messages: {
            ...app.messages,
            send: null,
          },
        },
      }
    }
    case AppActions.UpdateSendPrice: {
      /**
       * payload: new price
       */
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            price: payload,
          },
        },
      }
    }
    case AppActions.UpdateSendDescription: {
      /**
       * payload: new description
       */
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            description: payload,
          },
        },
      }
    }
    case AppActions.UpdateGeneratedTx: {
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            generatedTx: payload || null,
          },
        },
      }
    }
    case AppActions.ClearSendState: {
      return {
        ...state,
        app: {
          ...app,
          send: initStates.app.send,
        },
      }
    }
    case AppActions.RequestPassword: {
      return {
        ...state,
        app: {
          ...app,
          passwordRequest: payload,
        },
      }
    }
    case AppActions.DismissPasswordRequest: {
      return {
        ...state,
        app: {
          ...app,
          passwordRequest: initStates.app.passwordRequest,
        },
      }
    }
    case AppActions.UpdatePassword: {
      return {
        ...state,
        app: {
          ...app,
          passwordRequest: {
            ...app.passwordRequest,
            password: payload,
          },
        },
      }
    }
    case AppActions.UpdateMessage: {
      /**
       * payload: {type,content, timestamp}
       */
      return {
        ...state,
        app: {
          ...app,
          messages: {
            ...app.messages,
            ...payload,
          },
        },
      }
    }
    case AppActions.AddNotification: {
      /**
       * payload: { type, content }
       */
      // NOTICE: for simplicty, only one notification will be displayed
      return {
        ...state,
        app: {
          ...app,
          notifications: [...app.notifications, payload],
          showTopAlert: true,
        },
      }
    }
    case AppActions.DismissNotification: {
      /**
       * payload: timstamp
       */
      return {
        ...state,
        app: {
          ...app,
          messages: {
            ...app.messages,
          },
          notifications: app.notifications.filter(({ timestamp }) => timestamp !== payload),
          showAllNotifications: app.notifications.length > 1,
          showTopAlert:
            app.notifications.findIndex(message => message.timestamp === payload) === app.notifications.length - 1
              ? false
              : app.showTopAlert,
        },
      }
    }
    case AppActions.ClearNotificationsOfCode: {
      const notifications = app.notifications.filter(({ code }) => code !== payload)
      return {
        ...state,
        app: {
          ...app,
          messages: {
            ...app.messages,
          },
          showTopAlert:
            app.showTopAlert &&
            notifications.length > 0 &&
            !(app.notifications.length > 0 && app.notifications[app.notifications.length - 1].code === payload),
          notifications,
        },
      }
    }
    case AppActions.ClearNotifications: {
      return {
        ...state,
        app: {
          ...app,
          messages: {
            ...app.messages,
          },
          notifications: [],
        },
      }
    }
    case AppActions.CleanTransactions: {
      return {
        ...state,
        chain: {
          ...chain,
          transactions: initStates.chain.transactions,
        },
      }
    }
    case AppActions.UpdateLoadings: {
      return {
        ...state,
        app: {
          ...app,
          loadings: {
            ...app.loadings,
            ...payload,
          },
        },
      }
    }
    case AppActions.UpdateAlertDialog: {
      return {
        ...state,
        app: {
          ...app,
          alertDialog: payload,
        },
      }
    }
    case AppActions.PopIn: {
      return {
        ...state,
        app: {
          ...app,
          popups: [...app.popups, payload],
        },
      }
    }
    case AppActions.PopOut: {
      return {
        ...state,
        app: {
          ...app,
          popups: app.popups.slice(1),
        },
      }
    }
    case AppActions.ToggleTopAlertVisibility: {
      const showTopAlert = payload === undefined ? !app.showTopAlert : payload
      return {
        ...state,
        app: {
          ...app,
          showTopAlert,
          notifications: showTopAlert ? app.notifications : app.notifications.slice(0, -1),
        },
      }
    }
    case AppActions.ToggleAllNotificationVisibility: {
      return {
        ...state,
        app: {
          ...app,
          showAllNotifications: payload === undefined ? !app.showAllNotifications : payload,
        },
      }
    }
    case AppActions.ToggleIsAllowedToFetchList: {
      return {
        ...state,
        app: {
          ...app,
          isAllowedToFetchList: payload === undefined ? !app.isAllowedToFetchList : payload,
        },
      }
    }
    default: {
      return state
    }
  }
}
