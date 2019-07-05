import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'
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
      onChange: (e: React.FormEvent<Pick<any, string>>) => {
        setName(e.currentTarget.value)
      },
    },
    remote: {
      value: remote,
      onChange: (e: React.FormEvent<Pick<any, string>>) => {
        setRemote(e.currentTarget.value)
      },
    },
  }
}

type EditorType = ReturnType<typeof useNetworkEditor>

export const useInitialize = (id: string, networks: State.Network[], initialize: Function, dispatch: StateDispatch) => {
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
  id: string,
  name: string,
  remote: string,
  networks: State.Network[],
  dispatch: StateDispatch
) =>
  useCallback(() => {
    dispatch(actionCreators.createOrUpdateNetwork({ id, name, remote }, networks))
  }, [id, name, remote, networks, dispatch])

export default {
  useInitialize,
  useInputs,
  useNetworkEditor,
  useIsInputsValid,
  useHandleSubmit,
}
