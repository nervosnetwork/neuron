import { createWallet, deleteWallet, importWallet, exportWallet, setNetwork } from '../../services/UILayer'
import { Network } from '../../contexts/Chain'
import { saveNetworks, loadNetworks } from '../../utils/localStorage'
import { Routes } from '../../utils/const'

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
}
export const initState = {
  tempWallet: {
    name: '',
    password: '',
    mnemonic: '',
  },
  networkEditor: {
    name: '',
    remote: '',
  },
  errorMsgs: {
    networks: '',
  },
  dialog: null as React.ReactNode,
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
  setNetowrk: (network: Network) => {
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
          networks: 'Name is required',
        },
      }
    }
    if (!editorNetwork.remote) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: 'URL is required',
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
            networks: 'Network name exists',
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
    navTo(Routes.SettingsNetwork)
    return {
      type: MainActions.SaveNetworks,
      payload: ns,
    }
  },
  deleteNetwork: (idx: number) => {
    const networks = loadNetworks()
    networks.splice(idx, 1)
    saveNetworks(networks)
    window.dispatchEvent(new Event('NetworksUpdate'))
    return {
      type: MainActions.SetDialog,
      payload: null,
    }
  },
}
export const reducer = (state: typeof initState, action: { type: MainActions; payload: any }) => {
  switch (action.type) {
    case MainActions.UpdateTempWallet: {
      return {
        ...state,
        tempWallet: {
          ...state.tempWallet,
          ...action.payload,
        },
      }
    }
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
    case MainActions.ErrorMessage: {
      return {
        ...state,
        errorMsgs: {
          ...state.errorMsgs,
          ...action.payload,
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
export type MainDispatch = React.Dispatch<{ type: MainActions; payload?: any }>
