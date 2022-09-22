import { useState, useCallback } from 'react'

export const useInputWords = () => {
  const [inputsWords, setInputsWords] = useState<string[]>(new Array(12).fill(''))
  const onChangeInput = useCallback(
    e => {
      const idx = +e.target.dataset.idx
      const { value } = e.target
      setInputsWords(v => {
        const newWords = [...v]
        newWords[idx] = value
        return newWords
      })
    },
    [setInputsWords]
  )
  return {
    inputsWords,
    onChangeInput,
    setInputsWords,
  }
}

export default {
  useInputWords,
}
