import { useState, useCallback } from 'react'

const MNEMONIC_SENTENCE_WORDS = 12

export const useInputWords = () => {
  const [inputsWords, setInputsWords] = useState<string[]>(new Array(MNEMONIC_SENTENCE_WORDS).fill(''))
  const onChangeInput = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | {
            target: {
              dataset: { idx: string }
              value: string
            }
          }
    ) => {
      const idx = Number(e.target.dataset.idx)
      if (Number.isNaN(idx)) return
      const { value } = e.target
      if (Number(idx) === 0) {
        const list = value
          .trim()
          .replace(/[^0-9a-z]+/g, ' ')
          .split(' ')
        if (list.length === MNEMONIC_SENTENCE_WORDS) {
          setInputsWords(list)
          return
        }
      }

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
