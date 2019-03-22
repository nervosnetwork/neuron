import {
  createWallet,
  deleteWallet,
  importWallet,
  exportWallet,
  setNetwork,
  sendCapacity,
  TransferItem,
} from '../../services/UILayer'
import { Network } from '../../contexts/Chain'
import { defaultNetworks } from '../../contexts/Settings'
import { saveNetworks, loadNetworks } from '../../utils/localStorage'
import { Routes, CapacityUnit, Message } from '../../utils/const'
import { verifyAddress } from '../../utils/validators'

const Testnet = defaultNetworks[0].name

export enum MainActions {
  UpdateTempWallet,
  CreateWallet,
  DeleteWallet,
  ImportWallet,
  ExportWallet,
  GetTransactions,
  SetPage,
  SetNetwork,
  UpdateNetworkEditor,
  SaveNetworks,
  DeleteNetwork,
  ErrorMessage,
  SetDialog,
  AddItemInTransfer,
  RemoveItemInTransfer,
  UpdateItemInTransfer,
  UpdateTransfer,
  UpdatePassword,
}
export const initState = {
  tempWallet: {
    name: '',
    password: '',
    mnemonic: '',
  },
  transfer: {
    items: [
      {
        address: '',
        capacity: '',
        unit: CapacityUnit.CKB,
      },
    ],
    submitting: false,
  },
  networkEditor: {
    name: '',
    remote: '',
  },
  errorMsgs: {
    networks: '',
    transfer: '',
  },
  password: '',
  dialog: {
    open: false,
  } as { open: boolean; [index: string]: any },
}
export type InitState = typeof initState
export const actionCreators = {
  createWallet: (wallet: typeof initState.tempWallet) => {
    createWallet(wallet)
    return {
      type: MainActions.CreateWallet,
    }
  },
  importWallet: (wallet: typeof initState.tempWallet) => {
    importWallet(wallet)
    return {
      type: MainActions.ImportWallet,
    }
  },
  deleteWallet: (address: string) => {
    deleteWallet(address)
    return {
      type: MainActions.DeleteWallet,
    }
  },
  exportWallet: () => {
    exportWallet()
    return {
      type: MainActions.ExportWallet,
    }
  },
  setNetwork: (network: Network) => {
    setNetwork(network)
    return {
      type: MainActions.SetNetwork,
      payload: network,
    }
  },
  saveNetworks: (idx: number, networks: Network[], editorNetwork: Network, navTo: (path: string) => void) => {
    if (!editorNetwork.name) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: Message.NameIsRequired,
        },
      }
    }
    if (editorNetwork.name.length > 28) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: Message.NameShouldBeLessThanOrEqualTo28Characters,
        },
      }
    }
    if (!editorNetwork.remote) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: Message.URLIsRequired,
        },
      }
    }
    const ns = [...networks]

    if (idx === -1) {
      // create
      if (ns.map(n => n.name).indexOf(editorNetwork.name) > -1) {
        // exist
        return {
          type: MainActions.ErrorMessage,
          payload: {
            networks: Message.NetworkNameExist,
          },
        }
      }
      ns.push(editorNetwork)
    } else {
      // edit
      ns[idx] = editorNetwork
    }

    // temp solution, better to remove
    saveNetworks(ns)
    window.dispatchEvent(new Event('NetworksUpdate'))
    navTo(Routes.SettingsNetworks)
    return {
      type: MainActions.SaveNetworks,
      payload: ns,
    }
  },

  deleteNetwork: (name: string) => {
    if (name === Testnet) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: `${Testnet} is unremovable`,
        },
      }
    }
    const networks = loadNetworks()
    const newNetworks = networks.filter((n: Network) => n.name !== name)
    saveNetworks(newNetworks)
    window.dispatchEvent(new Event('NetworksUpdate'))
    return {
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    }
  },

  submitTransfer: (items: TransferItem[]) => {
    // TODO: verification
    const errorAction = {
      type: MainActions.ErrorMessage,
      payload: {
        transfer: Message.AtLeastOneAddressNeeded as string,
      },
    }
    if (!items.length || !items[0].address) {
      return errorAction
    }
    const invalid = items.some(
      (item): boolean => {
        if (!verifyAddress(item.address)) {
          errorAction.payload.transfer = Message.InvalidAddress
          return true
        }
        if (+item.capacity < 0) {
          errorAction.payload.transfer = Message.InvalidCapacity
          return true
        }
        return false
      },
    )
    if (invalid) {
      return errorAction
    }
    return {
      type: MainActions.SetDialog,
      payload: {
        open: true,
        items,
      },
    }
  },

  confirmTransfer: ({ items, password }: { items: TransferItem[]; password: string }) => {
    const response = sendCapacity(items, password)
    if (response && response[0]) {
      if (response[0].status) {
        return {
          type: MainActions.UpdateTransfer,
          payload: {
            submitting: false,
          },
        }
      }
      return {
        type: MainActions.ErrorMessage,
        payload: {
          transfer: response[0].msg,
        },
      }
    }
    throw new Error('No Response')
  },
}
export const reducer = (state: typeof initState, action: { type: MainActions; payload: any }) => {
  switch (action.type) {
    // wallet
    case MainActions.UpdateTempWallet: {
      return {
        ...state,
        tempWallet: {
          ...state.tempWallet,
          ...action.payload,
        },
      }
    }
    // network
    case MainActions.UpdateNetworkEditor: {
      return {
        ...state,
        networkEditor: {
          ...state.networkEditor,
          ...action.payload,
        },
      }
    }
    case MainActions.DeleteNetwork: {
      return {
        ...state,
        networkEditor: {
          ...state.networkEditor,
          ...action.payload,
        },
      }
    }
    // transfer
    case MainActions.AddItemInTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items: [
            ...state.transfer.items,
            {
              address: '',
              capacity: '',
              unit: CapacityUnit.CKB,
            },
          ],
          submitting: false,
        },
      }
    }
    case MainActions.RemoveItemInTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items: [...state.transfer.items].splice(action.payload),
          submitting: false,
        },
      }
    }
    case MainActions.UpdateItemInTransfer: {
      const items = [...state.transfer.items]
      items[action.payload.idx] = {
        ...items[action.payload.idx],
        ...action.payload.item,
      }
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          items,
        },
      }
    }
    case MainActions.UpdateTransfer: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          transfer: '',
        },
        transfer: {
          ...state.transfer,
          submitting: false,
          ...action.payload,
        },
      }
    }
    case MainActions.UpdatePassword: {
      return {
        ...state,
        password: action.payload,
      }
    }
    case MainActions.ErrorMessage: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          ...action.payload,
        },
        transfer: {
          ...state.transfer,
          submitting: action.payload.transfer ? false : state.transfer.submitting,
        },
      }
    }
    case MainActions.SetDialog: {
      return {
        ...state,
        dialog: action.payload,
      }
    }
    default: {
      return state
    }
  }
}

export type MainActionCreators = typeof actionCreators
export type MainDispatch = React.Dispatch<{ type: MainActions; payload?: any }>
