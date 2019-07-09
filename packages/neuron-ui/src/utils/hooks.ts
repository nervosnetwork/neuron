import { useEffect, useState, useCallback } from 'react'
import actionCreators from 'states/stateProvider/actionCreators'

export const useGoBack = (history: any) => {
  return useCallback(() => {
    history.goBack()
  }, [history])
}

export const useLocalDescription = (
  type: 'address' | 'transaction',
  walletID: string,
  owners: { key: string; description: string }[],
  dispatch: any
) => {
  const [localDescription, setLocalDescription] = useState<string[]>([])

  useEffect(() => {
    setLocalDescription(owners.map(owner => owner.description))
  }, [owners])

  const submitDescription = useCallback(
    (idx: number) => {
      if (owners[idx].description === localDescription[idx]) {
        return
      }
      dispatch(
        actionCreators.updateDescription({
          type,
          walletID,
          key: owners[idx].key,
          description: localDescription[idx],
        })
      )
    },
    [type, walletID, dispatch, localDescription, owners]
  )

  const onDescriptionFieldBlur = useCallback(
    (idx: number): React.FocusEventHandler => () => {
      submitDescription(idx)
    },
    [submitDescription]
  )
  const onDescriptionPress = useCallback(
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key && e.key === 'Enter') {
        submitDescription(idx)
      }
    },
    [submitDescription]
  )
  const onDescriptionChange = useCallback(
    (idx: number) => (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        const newDesc = [...localDescription]
        newDesc[idx] = value
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
