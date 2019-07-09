import { networksCall } from 'services/UILayer'

import { Message, MAX_NETWORK_NAME_LENGTH, UNREMOVABLE_NETWORK_ID, UNREMOVABLE_NETWORK } from 'utils/const'
import i18n from 'utils/i18n'
import { AppActions } from '../reducer'

export default {
  createOrUpdateNetwork: ({ id, name, remote }: State.Network, networks: State.Network[]) => {
    const warning = {
      type: 'warning',
      timestamp: Date.now(),
      content: '',
    }
    if (!name) {
      return {
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.NameRequired),
        },
      }
    }
    if (name.length > MAX_NETWORK_NAME_LENGTH) {
      return {
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.LengthOfNameShouldBeLessThanOrEqualTo, {
            length: MAX_NETWORK_NAME_LENGTH,
          }),
        },
      }
    }
    if (!remote) {
      return {
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.URLRequired),
        },
      }
    }
    if (!remote.startsWith('http')) {
      return {
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.ProtocolRequired),
        },
      }
    }
    // verification, for now, only name is unique
    if (id === 'new') {
      if (networks.some(network => network.name === name)) {
        return {
          type: AppActions.AddNotification,
          payload: {
            ...warning,
            content: i18n.t(Message.NetworkNameUsed),
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
          type: AppActions.AddNotification,
          payload: {
            ...warning,
            content: i18n.t(Message.NetworkNameUsed),
          },
        }
      }
      networksCall.update(id!, {
        name,
        remote,
      })
    }
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
  deleteNetwork: (id?: string) => {
    if (id === undefined) {
      throw new Error('No network id found')
    }
    if (id === UNREMOVABLE_NETWORK_ID) {
      return {
        type: AppActions.AddNotification,
        payload: {
          type: 'warning',
          timestamp: Date.now(),
          conetent: i18n.t(`messages.is-unremovable`, { target: UNREMOVABLE_NETWORK }),
        },
      }
    }
    networksCall.delete(id)
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
  setNetwork: (id: string) => {
    networksCall.activate(id)
    return {
      type: AppActions.Ignore,
      payload: null,
    }
  },
}
