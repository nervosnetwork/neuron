import React, { useMemo } from 'react'
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
  const wordList = useMemo(() => Object.assign(new Array(12).fill(''), words?.split(' ')), [words])
  return (
    <div className={styles.root}>
      {disabled
        ? wordList.map((v, idx) => (
            <div key={v || idx.toString()} className={styles.showItem}>
              {idx + 1}
              <span>{v}</span>
            </div>
          ))
        : wordList.map((v, idx) => (
            <div
              key={v || idx.toString()}
              className={`${styles.wordItem}
              ${inputsWords[idx] && v && v !== inputsWords[idx] ? styles.errorWords : ''}`}
            >
              {idx + 1}
              <input data-idx={idx} className={styles.input} onChange={onChangeInputWord} />
            </div>
          ))}
    </div>
  )
}

MnemonicInput.displayName = 'MnemonicInput'

export default MnemonicInput
