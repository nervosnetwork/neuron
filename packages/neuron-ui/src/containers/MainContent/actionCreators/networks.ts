import { Network } from '../../../contexts/NeuronWallet'
import { networksCall } from '../../../services/UILayer'
import { MainActions } from '../reducer'

import { Message, MAX_NETWORK_NAME_LENGTH, UnremovableNetworkId, UnremovableNetwork } from '../../../utils/const'
import i18n from '../../../utils/i18n'

export default {
  getNetwork: (id: string) => {
    networksCall.get(id)
    return {
      type: MainActions.UpdateLoading,
      payload: { networks: true },
    }
  },
  createOrUpdateNetwork: ({ id, name, remote }: Network, networks: Network[]) => {
    if (!name) {
      return {
        type: MainActions.ErrorMessage,
        payload: { networks: i18n.t(`messages.${Message.NameIsRequired}`) },
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
        payload: { networks: i18n.t(`messages.${Message.URLIsRequired}`) },
      }
    }
    // verification, for now, only name is unique
    if (id === 'new') {
      if (networks.some(network => network.name === name)) {
        return {
          type: MainActions.ErrorMessage,
          payload: {
            networks: i18n.t(`messages.name-has-been-used`),
          },
        }
      }
      networksCall.create({
        name,
        remote,
      })
    } else {
      if (networks.some(network => network.name === name && network.id !== id)) {
        return {
          type: MainActions.ErrorMessage,
          payload: {
            networks: i18n.t(`messages.name-has-been-used`),
          },
        }
      }
      networksCall.update(id!, {
        name,
        remote,
      })
    }
    return {
      type: MainActions.UpdateLoading,
      payload: { network: true },
    }
  },
  deleteNetwork: (id?: string) => {
    if (id === undefined) throw new Error('No network id found')
    if (id === UnremovableNetworkId) {
      return {
        type: MainActions.ErrorMessage,
        payload: { networks: i18n.t(`messages.is-unremovable`, { target: UnremovableNetwork }) },
      }
    }
    networksCall.delete(id)
    return {
      type: MainActions.SetDialog,
      payload: { open: false },
    }
  },
  setNetwork: (id: string) => {
    // TODO: verification
    networksCall.activate(id)
    return {
      type: MainActions.Networks,
      payload: id,
    }
  },
}
