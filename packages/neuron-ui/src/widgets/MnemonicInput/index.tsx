import React, { useCallback, useMemo, useState } from 'react'
import styles from './index.module.scss'

const MnemonicInput = ({
  disabled,
  words,
  inputsWords,
  onChangeInputWord,
}: {
  disabled: boolean
  words: string
  inputsWords: string[]
  onChangeInputWord: React.ChangeEventHandler<HTMLInputElement>
}) => {
  const wordList = useMemo(() => (words ? words.split(' ') : new Array(12).fill('')), [words])
  const [activityInputIndex, setActivityInputIndex] = useState<number | null>(null)
  const onFocusInput = useCallback(
    e => {
      setActivityInputIndex(+e.target.dataset.idx)
    },
    [setActivityInputIndex]
  )
  const onBlurInput = useCallback(() => {
    setActivityInputIndex(null)
  }, [setActivityInputIndex])
  return (
    <div className={styles.root}>
      {disabled
        ? wordList.map((v, idx) => (
            <div key={v || idx.toString()}>
              {idx + 1}
              <span>{v}</span>
            </div>
          ))
        : wordList.map((v, idx) => (
            <div
              key={v || idx.toString()}
              className={`${activityInputIndex === idx ? styles.activity : ''}
              ${
                activityInputIndex !== idx && inputsWords[idx] && v && v !== inputsWords[idx] ? styles.errorWords : ''
              }`}
            >
              {idx + 1}
              <input
                data-idx={idx}
                className={styles.input}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
                onChange={onChangeInputWord}
              />
            </div>
          ))}
    </div>
  )
}

MnemonicInput.displayName = 'MnemonicInput'

export default MnemonicInput
