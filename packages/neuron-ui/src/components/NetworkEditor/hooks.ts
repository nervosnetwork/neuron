import { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { StateDispatch } from 'states/stateProvider/reducer'
import { createNetwork, updateNetwork, addNotification } from 'states/stateProvider/actionCreators'

import { MAX_NETWORK_NAME_LENGTH, ErrorCode } from 'utils/const'

export const useOnSubmit = (
  id: string = '',
  name: string = '',
  remote: string = '',
  networks: Readonly<State.Network[]> = [],
  history: ReturnType<typeof useHistory>,
  dispatch: StateDispatch,
  disabled: boolean
) =>
  useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault()
      if (disabled) {
        return
      }
      let errorMessage:
        | State.Message<ErrorCode, { fieldName: string; fieldValue?: string; length?: string }>
        | undefined
      if (!name) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.FieldRequired,
          meta: {
            fieldName: 'name',
          },
        }
        addNotification(errorMessage)(dispatch)
        return
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
        addNotification(errorMessage)(dispatch)
        return
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
        addNotification(errorMessage)(dispatch)
        return
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
        addNotification(errorMessage)(dispatch)
        return
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
          addNotification(errorMessage)(dispatch)
          return
        }
        createNetwork({
          name,
          remote,
        })(dispatch, history)
        return
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
        addNotification(errorMessage)(dispatch)
        return
      }
      updateNetwork({
        networkID: id!,
        options: {
          name,
          remote,
        },
      })(dispatch, history)
    },
    [id, name, remote, networks, history, dispatch, disabled]
  )

export default {
  useOnSubmit,
}
