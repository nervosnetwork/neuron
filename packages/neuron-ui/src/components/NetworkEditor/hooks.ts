import { useCallback } from 'react'

import { StateDispatch } from 'states/stateProvider/reducer'
import { createNetwork, updateNetwork, addNotification } from 'states/stateProvider/actionCreators'

import { MAX_NETWORK_NAME_LENGTH, ErrorCode } from 'utils/const'

export const useHandleSubmit = (
  id: string = '',
  name: string = '',
  remote: string = '',
  networks: Readonly<State.Network[]> = [],
  history: any,
  dispatch: StateDispatch
) =>
  useCallback(async () => {
    let errorMessage: State.Message<ErrorCode, { fieldName: string; fieldValue?: string; length?: string }> | undefined
    if (!name) {
      errorMessage = {
        type: 'warning',
        timestamp: +new Date(),
        code: ErrorCode.FieldRequired,
        meta: {
          fieldName: 'name',
        },
      }
      return addNotification(errorMessage)(dispatch)
    }
    if (name.length > MAX_NETWORK_NAME_LENGTH) {
      errorMessage = {
        type: 'warning',
        timestamp: +new Date(),
        code: ErrorCode.FieldTooLong,
        meta: {
          fieldName: 'name',
          fieldValue: name,
          length: `${MAX_NETWORK_NAME_LENGTH}`,
        },
      }
      return addNotification(errorMessage)(dispatch)
    }
    if (!remote) {
      errorMessage = {
        type: 'warning',
        timestamp: +new Date(),
        code: ErrorCode.FieldRequired,
        meta: {
          fieldName: 'remote',
        },
      }
      return addNotification(errorMessage)(dispatch)
    }
    if (!remote.startsWith('http')) {
      errorMessage = {
        type: 'warning',
        timestamp: +new Date(),
        code: ErrorCode.ProtocolRequired,
        meta: {
          fieldName: 'remote',
          fieldValue: remote,
        },
      }
      return addNotification(errorMessage)(dispatch)
    }
    // verification, for now, only name is unique
    if (id === 'new') {
      if (networks.some(network => network.name === name)) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.FieldUsed,
          meta: {
            fieldName: 'name',
            fieldValue: name,
          },
        }
        return addNotification(errorMessage)(dispatch)
      }
      return createNetwork({
        name,
        remote,
      })(dispatch, history)
    }

    if (networks.some(network => network.name === name && network.id !== id)) {
      errorMessage = {
        type: 'warning',
        timestamp: +new Date(),
        code: ErrorCode.FieldUsed,
        meta: {
          fieldName: 'name',
          fieldValue: name,
        },
      }
      return addNotification(errorMessage)(dispatch)
    }
    return updateNetwork({
      networkID: id!,
      options: {
        name,
        remote,
      },
    })(dispatch, history)
  }, [id, name, remote, networks, history, dispatch])

export default {
  useHandleSubmit,
}
