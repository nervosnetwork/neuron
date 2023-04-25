import { useCallback } from 'react'

import { StateDispatch, createNetwork, updateNetwork, addNotification } from 'states'
import { ErrorCode, CONSTANTS } from 'utils'

const { MAX_NETWORK_NAME_LENGTH } = CONSTANTS

export const useOnSubmit = ({
  id = '',
  name = '',
  remote = '',
  networks = [],
  callback,
  dispatch,
  disabled,
  setIsUpdating,
}: {
  id: string
  name: string
  remote: string
  networks: Readonly<State.Network[]>
  callback: () => void
  dispatch: StateDispatch
  disabled: boolean
  setIsUpdating: React.Dispatch<boolean>
}) =>
  useCallback((): void => {
    if (disabled) {
      return
    }
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
      })(dispatch, callback)
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
    setIsUpdating(true)
    updateNetwork({
      networkID: id!,
      options: {
        name,
        remote,
      },
    })(dispatch, callback).then(() => setIsUpdating(false))
  }, [id, name, remote, networks, callback, dispatch, disabled, setIsUpdating])

export default {
  useOnSubmit,
}
