import { useEffect, useState, useCallback } from 'react'
import { updateTransactionDescription, updateAddressDescription } from 'states/stateProvider/actionCreators'
import { StateDispatch } from 'states/stateProvider/reducer'

export const useGoBack = (history: any) => {
  return useCallback(() => {
    history.goBack()
  }, [history])
}

export const useLocalDescription = (
  type: 'address' | 'transaction',
  walletID: string,
  owners: { key: string; description: string }[],
  dispatch: StateDispatch
) => {
  const [localDescription, setLocalDescription] = useState<{ description: string; key: string }[]>([])

  useEffect(() => {
    setLocalDescription(
      owners.map(owner => {
        const local = localDescription.find(localDesc => localDesc.key === owner.key)
        if (local && local.description) {
          return local
        }
        return owner
      })
    )
  }, [owners, localDescription])

  const submitDescription = useCallback(
    (key: string) => {
      const ownerDesc = owners.find(owner => owner.key === key)
      const localDesc = localDescription.find(local => local.key === key)
      if (ownerDesc && localDesc && ownerDesc.description === localDesc.description) {
        return
      }
      if (localDesc && type === 'transaction') {
        updateTransactionDescription({
          hash: key,
          description: localDesc.description,
        })(dispatch)
      }
      if (localDesc && type === 'address') {
        updateAddressDescription({
          walletID,
          address: key,
          description: localDesc.description,
        })(dispatch)
      }
    },
    [type, walletID, localDescription, owners, dispatch]
  )

  const onDescriptionFieldBlur = useCallback(
    (key: string): React.FocusEventHandler => () => {
      submitDescription(key)
    },
    [submitDescription]
  )
  const onDescriptionPress = useCallback(
    (key: string) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key && e.key === 'Enter') {
        submitDescription(key)
      }
    },
    [submitDescription]
  )
  const onDescriptionChange = useCallback(
    (key: string) => (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        const newDesc = [...localDescription].map(desc => (desc.key === key ? { key, description: value } : desc))
        setLocalDescription(newDesc)
      }
    },
    [localDescription, setLocalDescription]
  )
  return {
    localDescription,
    onDescriptionFieldBlur,
    onDescriptionPress,
    onDescriptionChange,
  }
}

export default { useGoBack, useLocalDescription }
