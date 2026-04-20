import { useState, useCallback, useEffect } from 'react'

const MNEMONIC_SENTENCE_WORDS = 12

export const useInputWords = (wordsCount: number = MNEMONIC_SENTENCE_WORDS) => {
  const [inputsWords, setInputsWords] = useState<string[]>(new Array(wordsCount).fill(''))
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
  useEffect(() => {
    setInputsWords(new Array(wordsCount).fill(''))
  }, [wordsCount])
  return {
    inputsWords,
    onChangeInput,
    setInputsWords,
  }
}

export default {
  useInputWords,
}
