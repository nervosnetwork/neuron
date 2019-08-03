import { useState, useEffect, useMemo, useCallback } from 'react'

import { StateDispatch } from 'states/stateProvider/reducer'
import { createNetwork, updateNetwork, addNotification } from 'states/stateProvider/actionCreators'

import { Message, MAX_NETWORK_NAME_LENGTH } from 'utils/const'

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
          type: 'warning',
          content: i18n.t('messages.network-is-not-found'),
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
            return t('messages.url-required')
          }
          if (!/^https?:\/\//.test(url)) {
            return t('messages.rpc-url-should-have-protocol')
          }
          if (/\s/.test(url)) {
            return t('messages.rpc-url-should-have-no-whitespaces')
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
            return t('messages.name-required')
          }
          if (usedNetworkNames.includes(name)) {
            return t('messages.network-name-used')
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
    const warning = {
      type: 'warning' as 'warning',
      timestamp: Date.now(),
      content: '',
    }
    if (!name) {
      return addNotification({
        ...warning,
        content: i18n.t(Message.NameRequired),
      })(dispatch)
    }
    if (name.length > MAX_NETWORK_NAME_LENGTH) {
      return addNotification({
        ...warning,
        content: i18n.t(Message.LengthOfNameShouldBeLessThanOrEqualTo, {
          length: MAX_NETWORK_NAME_LENGTH,
        }),
      })(dispatch)
    }
    if (!remote) {
      return addNotification({
        ...warning,
        content: i18n.t(Message.URLRequired),
      })(dispatch)
    }
    if (!remote.startsWith('http')) {
      return addNotification({
        ...warning,
        content: i18n.t(Message.ProtocolRequired),
      })(dispatch)
    }
    // verification, for now, only name is unique
    if (id === 'new') {
      if (networks.some(network => network.name === name)) {
        return addNotification({
          ...warning,
          content: i18n.t(Message.NetworkNameUsed),
        })(dispatch)
      }
      return createNetwork({
        name,
        remote,
      })(dispatch, history)
    }
    if (networks.some(network => network.name === name && network.id !== id)) {
      return addNotification({
        ...warning,
        content: i18n.t(Message.NetworkNameUsed),
      })(dispatch)
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
