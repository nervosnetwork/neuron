import { useState, useEffect, useMemo, useCallback } from 'react'
import { MainActions, actionCreators } from '../../containers/MainContent/reducer'
import i18n from '../../utils/i18n'
import { Network } from '../../contexts/NeuronWallet'

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
  },
) => {
  const [name, setName] = useState(currentName)
  const [remote, setRemote] = useState(currentRemote)

  return {
    initiate: ({ name: initName, remote: initRemote }: { name: string; remote: string }) => {
      setName(initName)
      setRemote(initRemote)
    },
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
type DispatchType = React.Dispatch<{
  type: MainActions
  payload?: any
}>

export const useInitiate = (id: string, networks: Network[], editor: EditorType, dispatch: DispatchType) => {
  useEffect(() => {
    if (id !== 'new') {
      const network = networks.find(n => n.id === id)
      if (network) {
        editor.initiate(network)
      } else {
        dispatch({
          type: MainActions.ErrorMessage,
          payload: {
            networks: i18n.t('messages.network-is-not-found'),
          },
        })
      }
    }
    return () => {
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          networks: '',
        },
      })
    }
  }, [])
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
    [editor.remote, editor.name],
  )
}

export const useIsInputsValid = (editor: EditorType, cachedNetwork: Network | undefined) => {
  const invalidParams = useMemo(() => !editor.name.value || !editor.remote.value, [
    editor.name.value,
    editor.remote.value,
  ])

  const notModified = useMemo(
    () => cachedNetwork && (cachedNetwork.name === editor.name.value && cachedNetwork.remote === editor.remote.value),
    [cachedNetwork, editor.name.value, editor.remote.value],
  )
  return { invalidParams, notModified }
}

export const useHandleSubmit = (
  id: string,
  name: string,
  remote: string,
  networks: Network[],
  dispatch: DispatchType,
) =>
  useCallback(() => {
    dispatch(actionCreators.createOrUpdateNetwork({ id, name, remote }, networks))
  }, [id, name, remote, networks, dispatch])

export default {
  useInitiate,
  useInputs,
  useNetworkEditor,
  useIsInputsValid,
  useHandleSubmit,
}
