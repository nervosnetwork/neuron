import { useState, useCallback } from 'react'
import actionCreators from 'states/stateProvider/actionCreators'

export const useLocalDescription = (
  type: 'address' | 'transaction',
  ownsers: { key: string; description: string }[],
  dispatch: any
) => {
  const [localDescription, setLocalDescription] = useState(ownsers.map(owner => owner.description))

  const submitDescription = useCallback(
    (idx: number) => {
      if (ownsers[idx].description === localDescription[idx]) return
      dispatch(
        actionCreators.updateDescription({
          type,
          key: ownsers[idx].key,
          description: localDescription[idx],
        })
      )
    },
    [type, dispatch, localDescription, ownsers]
  )

  const onDescriptionFieldBlur = useCallback(
    (idx: number): React.FocusEventHandler => () => {
      submitDescription(idx)
    },
    [submitDescription]
  )
  const onDescriptionPress = useCallback(
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key && e.key === 'Enter') {
        submitDescription(idx)
      }
    },
    [submitDescription]
  )
  const onDescriptionChange = useCallback(
    (idx: number) => (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      if (undefined !== newValue) {
        const newDesc = localDescription.map((desc, index) => {
          if (index !== idx) return desc
          return newValue
        })
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

export default { useLocalDescription }
