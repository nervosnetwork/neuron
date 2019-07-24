import { useEffect, useState, useCallback } from 'react'
import { updateTransactionDescription } from 'services/remote'

export const useGoBack = (history: any) => {
  return useCallback(() => {
    history.goBack()
  }, [history])
}

export const useLocalDescription = (owners: { key: string; description: string }[]) => {
  const [localDescription, setLocalDescription] = useState<string[]>([])

  useEffect(() => {
    setLocalDescription(owners.map(owner => owner.description))
  }, [owners])

  const submitDescription = useCallback(
    (idx: number) => {
      if (owners[idx].description === localDescription[idx]) {
        return
      }
      updateTransactionDescription({
        hash: owners[idx].key,
        description: localDescription[idx],
      })
    },
    [localDescription, owners]
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
