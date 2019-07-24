import emptyWalletState from 'states/initStates/wallet'
import initStates from 'states/initStates'

export enum NeuronWalletActions {
  Initiate = 'initiate',
  Chain = 'chain',
  Wallet = 'wallet',
  Settings = 'settings',
  UpdateCodeHash = 'updateCodeHash',
  // networks
  UpdateNetworkList = 'updateNetworkList',
  UpdateCurrentNetworkID = 'updateCurrentNetworkID',
}
export enum AppActions {
  UpdateTransactionID = 'updateTransactionID',
  AddSendOutput = 'addSendOutput',
  RemoveSendOutput = 'removeSendOutput',
  UpdateSendOutput = 'updateSendOutput',
  UpdateSendPrice = 'updateSendPrice',
  UpdateSendDescription = 'updateSendDescription',
  ClearSendState = 'clearSendState',
  UpdateSendLoading = 'updateSendLoading',
  UpdateMessage = 'updateMessage',
  AddNotification = 'addNotification',
  RemoveNotification = 'removeNotification',
  ClearNotifications = 'clearNotifications',
  CleanTransaction = 'cleanTransaction',
  CleanTransactions = 'cleanTransactions',
  RequestPassword = 'requestPassword',
  DismissPasswordRequest = 'dismissPasswordRequest',
  UpdatePassword = 'updatePassword',
  UpdateTipBlockNumber = 'updateTipBlockNumber',
  UpdateChainInfo = 'updateChainInfo',
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
  if (process.env.NODE_ENV === 'development') {
    /* eslint-disable no-console */
    console.group()
    console.info('type', type)
    console.info('payload', payload)
    console.groupEnd()
    /* eslint-enable no-console */
  }
  switch (type) {
    // Actions of Neuron Wallet
    case NeuronWalletActions.Initiate: {
      const { wallets, wallet: incomingWallet } = payload
      return {
        ...state,
        wallet: incomingWallet || wallet,
        chain: {
          ...state.chain,
        },
        settings: {
          ...state.settings,
          wallets,
        },
      }
    }
    case NeuronWalletActions.Wallet: {
      if (!payload) {
        return {
          ...state,
          wallet: emptyWalletState,
        }
      }
      return {
        ...state,
        wallet: {
          ...state.wallet,
          ...payload,
        },
      }
    }
    case NeuronWalletActions.Chain: {
      const newState: State.AppWithNeuronWallet = {
        ...state,
        chain: {
          ...chain,
          ...payload,
        },
      }
      const pendingTxs = newState.chain.transactions.items
        .filter(item => item.status === 'pending')
        .sort((item1, item2) => +(item2.timestamp || item2.createdAt) - +(item1.timestamp || item1.createdAt))
      const determinedTxs = newState.chain.transactions.items
        .filter(item => item.status !== 'pending')
        .sort((item1, item2) => +(item2.timestamp || item2.createdAt) - +(item1.timestamp || item1.createdAt))
      newState.chain.transactions.items = [...pendingTxs, ...determinedTxs]
      return newState
    }
    case NeuronWalletActions.Settings: {
      if (payload.toggleAddressBook) {
        return {
          ...state,
          settings: {
            ...settings,
            showAddressBook: !state.settings.showAddressBook,
          },
        }
      }
      let currentWalletName = wallet.name
      if (payload.wallets) {
        const currentWallet = payload.wallets.find((w: { id: string; name: string }) => w.id === wallet.id)
        if (currentWallet) {
          currentWalletName = currentWallet.name
        }
      }
      return {
        ...state,
        wallet: {
          ...wallet,
          name: currentWalletName,
        },
        settings: {
          ...settings,
          ...payload,
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
        chain: {
          ...chain,
          networkID: payload,
        },
      }
    }
    // Actions of App
    case AppActions.UpdateTipBlockNumber: {
      /**
       * paylaod: tipBlockNumber
       */
      return {
        ...state,
        app: {
          ...state.app,
          tipBlockNumber: payload,
        },
      }
    }
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
    case AppActions.UpdateSendLoading: {
      return {
        ...state,
        app: {
          ...app,
          send: {
            ...app.send,
            loading: payload,
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
    case AppActions.CleanTransaction: {
      return {
        ...state,
        chain: {
          ...chain,
          transaction: initStates.chain.transaction,
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
          notifications: [payload],
        },
      }
    }
    case AppActions.RemoveNotification: {
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
    default: {
      return state
    }
  }
}
