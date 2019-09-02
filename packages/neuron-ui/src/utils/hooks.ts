import { useState, useCallback } from 'react'
import { updateTransactionDescription, updateAddressDescription } from 'states/stateProvider/actionCreators'
import { StateDispatch } from 'states/stateProvider/reducer'

export const useGoBack = (history: any) => {
  return useCallback(() => {
    history.goBack()
  }, [history])
}

export const useLocalDescription = (type: 'address' | 'transaction', walletID: string, dispatch: StateDispatch) => {
  const [localDescription, setLocalDescription] = useState<{ description: string; key: string }>({
    key: '',
    description: '',
  })

  const submitDescription = useCallback(
    (key: string, originDesc: string) => {
      if ((key && key !== localDescription.key) || localDescription.description === originDesc) {
        return
      }
      if (localDescription.key && type === 'transaction') {
        updateTransactionDescription({
          hash: localDescription.key,
          description: localDescription.description,
        })(dispatch)
      }
      if (localDescription.key && type === 'address') {
        updateAddressDescription({
          walletID,
          address: localDescription.key,
          description: localDescription.description,
        })(dispatch)
      }

      setLocalDescription({ key: '', description: '' })
    },
    [type, walletID, localDescription, dispatch]
  )

  const onDescriptionFieldBlur = useCallback(
    (key: string, originDesc: string): React.FocusEventHandler => () => {
      submitDescription(key, originDesc)
    },
    [submitDescription]
  )
  const onDescriptionPress = useCallback(
    (key: string, originDesc: string) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key && e.key === 'Enter') {
        submitDescription(key, originDesc)
      }
    },
    [submitDescription]
  )
  const onDescriptionChange = useCallback(
    (key: string) => (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      setLocalDescription({
        key,
        description: value || '',
      })
    },
    [setLocalDescription]
  )
  const onDescriptionSelected = useCallback(
    (hash: string, originDesc: string) => () => {
      setLocalDescription({ key: hash, description: originDesc })
    },
    [setLocalDescription]
  )
  return {
    localDescription,
    onDescriptionFieldBlur,
    onDescriptionPress,
    onDescriptionChange,
    onDescriptionSelected,
  }
}

export default { useGoBack, useLocalDescription }
