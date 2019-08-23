import { useState, useEffect, useMemo, useCallback } from 'react'

import { StateDispatch } from 'states/stateProvider/reducer'
import { createNetwork, updateNetwork, addNotification } from 'states/stateProvider/actionCreators'

import { MAX_NETWORK_NAME_LENGTH, ErrorCode } from 'utils/const'

import i18n from 'utils/i18n'

enum PlaceHolder {
  Name = 'My Custom Node',
  URL = 'http://localhost:8114',
}

enum TooltipText {
  Name = 'Alias for the node',
  URL = 'Address of the node',
}

export const useNetworkEditor = (
  { currentName, currentRemote }: { currentName: string; currentRemote: string } = {
    currentName: '',
    currentRemote: '',
  }
) => {
  const [name, setName] = useState(currentName)
  const [remote, setRemote] = useState(currentRemote)
  const initialize = useCallback(
    ({ name: initName, remote: initRemote }: { name: string; remote: string }) => {
      setName(initName)
      setRemote(initRemote)
    },
    [setName, setRemote]
  )

  return {
    initialize,
    name: {
      value: name,
      onChange: (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        if (undefined !== value) {
          setName(value)
        }
      },
    },
    remote: {
      value: remote,
      onChange: (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        if (undefined !== value) {
          setRemote(value)
        }
      },
    },
  }
}

type EditorType = ReturnType<typeof useNetworkEditor>

export const useInitialize = (
  id: string = '',
  networks: State.Network[] = [],
  initialize: Function,
  dispatch: StateDispatch
) => {
  useEffect(() => {
    if (id !== 'new') {
      const network = networks.find(n => n.id === id)
      if (network) {
        initialize(network)
      } else {
        addNotification({
          type: 'warning' as State.MessageType,
          timestamp: +new Date(),
          code: ErrorCode.FieldNotFound,
          meta: {
            fieldName: 'network',
          },
        })
      }
    }
  }, [dispatch, id, initialize, networks])
}

export const useInputs = (editor: EditorType, usedNetworkNames: string[], t: any) => {
  return useMemo(
    () => [
      {
        ...editor.remote,
        label: i18n.t('settings.network.edit-network.rpc-url'),
        tooltip: TooltipText.URL,
        placeholder: PlaceHolder.URL,
        onGetErrorMessage: (url: string) => {
          if (!url) {
            return t(`messages.codes.${ErrorCode.FieldRequired}`, { fieldName: 'remote' })
          }
          if (!/^https?:\/\//.test(url)) {
            return t(`messages.codes.${ErrorCode.ProtocolRequired}`, { fieldName: 'remote', fieldValue: url })
          }
          if (/\s/.test(url)) {
            return t(`messages.codes.${ErrorCode.NoWhiteSpaces}`, { fieldName: 'remote' })
          }
          return ''
        },
      },
      {
        ...editor.name,
        label: i18n.t('settings.network.edit-network.name'),
        tooltip: TooltipText.Name,
        placeholder: PlaceHolder.Name,
        onGetErrorMessage: (name: string) => {
          if (!name) {
            return t(`messages.codes.${ErrorCode.FieldRequired}`, { fieldName: 'name' })
          }
          if (usedNetworkNames.includes(name)) {
            return t(`messages.codes.${ErrorCode.FieldUsed}`, { fieldName: 'name', fieldValue: name })
          }
          if (name.length > MAX_NETWORK_NAME_LENGTH) {
            return t(`messages.codes.${ErrorCode.FieldTooLong}`, {
              fieldName: 'name',
              fieldValue: name,
              length: MAX_NETWORK_NAME_LENGTH,
            })
          }
          return ''
        },
      },
    ],
    [editor.remote, editor.name, usedNetworkNames, t]
  )
}

export const useIsInputsValid = (editor: EditorType, cachedNetwork: State.Network | undefined) => {
  const [errors, setErrors] = useState([!cachedNetwork && !editor.name.value, !cachedNetwork && !editor.remote.value])
  const notModified = useMemo(
    () => cachedNetwork && (cachedNetwork.name === editor.name.value && cachedNetwork.remote === editor.remote.value),
    [cachedNetwork, editor.name.value, editor.remote.value]
  )
  return { errors, setErrors, notModified }
}

export const useHandleSubmit = (
  id: string = '',
  name: string = '',
  remote: string = '',
  networks: State.Network[] = [],
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
  useInitialize,
  useInputs,
  useNetworkEditor,
  useIsInputsValid,
  useHandleSubmit,
}
