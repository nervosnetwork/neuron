import React from 'react'
import styles from './switch.module.scss'

const Switch = ({
  disabled,
  checked,
  onChange,
}: {
  disabled?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
}) => {
  return (
    <button
      type="button"
      className={styles.switchRoot}
      disabled={disabled}
      data-checked={!!checked}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.slider} />
    </button>
  )
}

Switch.displayName = 'Switch'

export default Switch
