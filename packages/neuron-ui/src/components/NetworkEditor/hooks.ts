import { useState, useEffect, useMemo, useCallback } from 'react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { Message, MAX_NETWORK_NAME_LENGTH, Routes } from 'utils/const'
import { createNetwork, updateNetwork } from 'services/remote'

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
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            networks: {
              type: 'warning',
              timestamp: Date.now(),
              content: i18n.t('messages.network-is-not-found'),
            },
          },
        })
      }
    }
  }, [dispatch, id, initialize, networks])
}

export const useInputs = (editor: EditorType) => {
  return useMemo(
    () => [
      {
        ...editor.remote,
        label: i18n.t('settings.network.edit-network.rpc-url'),
        tooltip: TooltipText.URL,
        placeholder: PlaceHolder.URL,
      },
      {
        ...editor.name,
        label: i18n.t('settings.network.edit-network.name'),
        tooltip: TooltipText.Name,
        placeholder: PlaceHolder.Name,
      },
    ],
    [editor.remote, editor.name]
  )
}

export const useIsInputsValid = (editor: EditorType, cachedNetwork: State.Network | undefined) => {
  const invalidParams = useMemo(() => !editor.name.value || !editor.remote.value, [
    editor.name.value,
    editor.remote.value,
  ])

  const notModified = useMemo(
    () => cachedNetwork && (cachedNetwork.name === editor.name.value && cachedNetwork.remote === editor.remote.value),
    [cachedNetwork, editor.name.value, editor.remote.value]
  )
  return { invalidParams, notModified }
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
      type: 'warning',
      timestamp: Date.now(),
      content: '',
    }
    let res
    if (!name) {
      return dispatch({
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.NameRequired),
        },
      })
    }
    if (name.length > MAX_NETWORK_NAME_LENGTH) {
      return dispatch({
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.LengthOfNameShouldBeLessThanOrEqualTo, {
            length: MAX_NETWORK_NAME_LENGTH,
          }),
        },
      })
    }
    if (!remote) {
      return dispatch({
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.URLRequired),
        },
      })
    }
    if (!remote.startsWith('http')) {
      return dispatch({
        type: AppActions.AddNotification,
        payload: {
          ...warning,
          content: i18n.t(Message.ProtocolRequired),
        },
      })
    }
    // verification, for now, only name is unique
    if (id === 'new') {
      if (networks.some(network => network.name === name)) {
        return dispatch({
          type: AppActions.AddNotification,
          payload: {
            ...warning,
            content: i18n.t(Message.NetworkNameUsed),
          },
        })
      }
      res = await createNetwork({
        name,
        remote,
      })
    } else {
      if (networks.some(network => network.name === name && network.id !== id)) {
        return dispatch({
          type: AppActions.AddNotification,
          payload: {
            ...warning,
            content: i18n.t(Message.NetworkNameUsed),
          },
        })
      }
      res = await updateNetwork(id!, {
        name,
        remote,
      })
    }
    if (res && res.status) {
      history.push(Routes.SettingsNetworks)
    }
    return res
  }, [id, name, remote, networks, history, dispatch])

export default {
  useInitialize,
  useInputs,
  useNetworkEditor,
  useIsInputsValid,
  useHandleSubmit,
}
