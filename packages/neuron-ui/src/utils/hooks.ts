import { useState, useCallback, useEffect, useContext } from 'react'
import NeuronWalletContext from 'contexts/NeuronWallet'
import { actionCreators } from 'containers/MainContent/reducer'

export const useFullscreen = (fullscreen: boolean) => {
  useEffect(() => {
    const content = document.querySelector('.main-content') as HTMLElement
    if (fullscreen) {
      content.classList.add('full-screen')
    }
    return () => {
      content.classList.remove('full-screen')
    }
  }, [fullscreen])
}

export const useNeuronWallet = () => useContext(NeuronWalletContext)

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
    (idx: number) => (e: any) => {
      const newDesc = localDescription.map((desc, index) => {
        if (index !== idx) return desc
        return e.currentTarget.value
      })
      setLocalDescription(newDesc)
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

export default { useLocalDescription, useFullscreen, useNeuronWallet }
