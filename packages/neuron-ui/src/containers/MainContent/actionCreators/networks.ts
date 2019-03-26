import { networks, NetworksMethod } from '../../../services/UILayer'
import { Network } from '../../../contexts/Chain'
import { MainActions } from '../reducer'

import { Message, MAX_NETWORK_NAME_LENGTH, UnremovableNetworkId, UnremovableNetwork } from '../../../utils/const'
import i18n from '../../../utils/i18n'

export default {
  getNetwork: (id: string) => {
    networks(NetworksMethod.Show, id)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        networks: true,
      },
    }
  },
  createOrUpdateNetowrk: ({ id, name, remote }: { id?: string; name: string; remote: string }) => {
    if (!name) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: i18n.t(`messages.${Message.NameIsRequired}`),
        },
      }
    }
    if (name.length > MAX_NETWORK_NAME_LENGTH) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: i18n.t(`messages.${Message.LengthOfNameShouldBeLessThanOrEqualTo}`, {
            length: MAX_NETWORK_NAME_LENGTH,
          }),
        },
      }
    }
    if (!remote) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: i18n.t(`messages.${Message.URLIsRequired}`),
        },
      }
    }
    if (id === 'new') {
      networks(NetworksMethod.Create, {
        name,
        remote,
      })
    } else {
      networks(NetworksMethod.Update, {
        id,
        name,
        remote,
      })
    }
    return {
      type: MainActions.UpdateLoading,
      payload: {
        network: true,
      },
    }
  },
  deleteNetwork: (id?: string) => {
    if (id === undefined) throw new Error('No network id found')
    if (id === UnremovableNetworkId) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: i18n.t(`messages.is-unremovable`, {
            target: UnremovableNetwork,
          }),
        },
      }
    }
    networks(NetworksMethod.Delete, id)
    return {
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    }
  },
  setNetwork: (network: Network) => {
    // TODO: verification
    networks(NetworksMethod.SetActive, network.id!)
    return {
      type: MainActions.Netowrks,
      payload: network,
    }
  },
  saveNetwork: (params: { id: string; name: string; remote: string }) => {
    if (!params.name) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: Message.NameIsRequired,
        },
      }
    }
    if (params.name.length > 28) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: `${i18n.t(Message.LengthOfNameShouldBeLessThanOrEqualTo)} ${MAX_NETWORK_NAME_LENGTH}`,
        },
      }
    }
    if (!params.remote) {
      return {
        type: MainActions.ErrorMessage,
        payload: {
          networks: Message.URLIsRequired,
        },
      }
    }
    return {
      type: MainActions.Netowrks,
      payload: params,
    }
  },
}
