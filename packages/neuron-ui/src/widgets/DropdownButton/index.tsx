import React from 'react'
import Button from 'widgets/Button'

import styles from './dropdownButton.module.scss'

interface DropdownButtonProps {
  mainBtnOnClick: () => void
  mainBtnLabel: string
  mainBtnDisabled: boolean
  list: { text: string; onClick: () => void; disabled?: boolean; disabledMsg?: string }[]
}

const DropdownButton = ({ mainBtnLabel, mainBtnOnClick, mainBtnDisabled, list }: DropdownButtonProps) => {
  return (
    <div className={styles.container}>
      <Button label={mainBtnLabel} type="cancel" onClick={mainBtnOnClick} disabled={mainBtnDisabled} />
      <div className={styles.dropdown}>
        <button type="button" className={styles.trigger}>
          <span className={styles.arrow} />
        </button>
        {!mainBtnDisabled ? (
          <div className={styles.content}>
            {list.map(({ text, onClick, disabled, disabledMsg }) => {
              return (
                <button
                  title={disabled ? disabledMsg : text}
                  type="button"
                  onClick={onClick}
                  key={text}
                  disabled={disabled}
                >
                  {text}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

DropdownButton.displayName = 'DropdownButton'

export default DropdownButton
