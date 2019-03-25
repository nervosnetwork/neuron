import { setNetwork } from '../../../services/UILayer'
import { Network } from '../../../contexts/Chain'
import { Routes, Message } from '../../../utils/const'
import { saveNetworks, loadNetworks } from '../../../utils/localStorage'
import { MainActions } from '../reducer'
import { defaultNetworks } from '../../../contexts/Settings'

const Testnet = defaultNetworks[0].name

export default {
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
}
