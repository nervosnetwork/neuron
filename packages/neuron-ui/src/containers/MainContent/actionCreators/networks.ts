import { networksCall } from '../../../services/UILayer'
import { MainActions } from '../reducer'

import {
  Message,
  MAX_NETWORK_NAME_LENGTH,
  UnremovableNetworkId,
  UnremovableNetwork,
  NetworkType,
} from '../../../utils/const'
import i18n from '../../../utils/i18n'

export default {
  getNetwork: (id: string) => {
    networksCall.get(id)
    return {
      type: MainActions.UpdateLoading,
      payload: { networks: true },
    }
  },
  createOrUpdateNetowrk: ({ id, name, remote }: { id?: string; name: string; remote: string }) => {
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
    if (id === 'new') {
      networksCall.create({
        name,
        remote,
        type: NetworkType.Normal,
      })
    } else {
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
      type: MainActions.Netowrks,
      payload: id,
    }
  },
  saveNetwork: (params: { id: string; name: string; remote: string }) => {
    if (!params.name) {
      return {
        type: MainActions.ErrorMessage,
        payload: { networks: Message.NameIsRequired },
      }
    }
    if (params.name.length > 28) {
      const message = `${i18n.t(Message.LengthOfNameShouldBeLessThanOrEqualTo)} ${MAX_NETWORK_NAME_LENGTH}`
      return {
        type: MainActions.ErrorMessage,
        payload: { networks: message },
      }
    }
    if (!params.remote) {
      return {
        type: MainActions.ErrorMessage,
        payload: { networks: Message.URLIsRequired },
      }
    }
    return {
      type: MainActions.Netowrks,
      payload: params,
    }
  },
}
