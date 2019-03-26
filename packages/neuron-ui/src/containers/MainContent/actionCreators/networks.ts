import { setNetwork, networks } from '../../../services/UILayer'
import { Network } from '../../../contexts/Chain'
import { MainActions } from '../reducer'

import { Message, MAX_NETWORK_NAME_LENGTH, UnremovableNetworkId } from '../../../utils/const'
import i18n from '../../../utils/i18n'

export default {
  getNetwork: (id: string) => {
    networks('show', id)
    return {
      type: MainActions.UpdateLoading,
      payload: {
        networks: true,
      },
    }
  },
  createOrUpdateNetowrk: ({ id, name, remote }: { id?: string; name: string; remote: string }) => {
    if (id === 'new') {
      networks('create', {
        name,
        remote,
      })
    } else {
      networks('update', {
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
          networks: `This netowrk is unremovable`,
        },
      }
    }
    networks('delete', id)
    return {
      type: MainActions.SetDialog,
      payload: {
        open: false,
      },
    }
  },
  //
  //
  //
  setNetwork: (network: Network) => {
    setNetwork(network)
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
