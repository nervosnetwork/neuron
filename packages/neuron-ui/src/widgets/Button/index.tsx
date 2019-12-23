import React from 'react'
import styles from './button.module.scss'

const Button = ({
  type = 'default',
  label,
  onClick,
  disabled = false,
  children,
  ...rest
}: {
  type?: 'default' | 'cancel' | 'ok' | 'submit' | 'confirm' | 'primary'
  label: string
  onClick: any
  disabled?: boolean
  children?: React.ReactChild
  [key: string]: any
}) => (
  <button
    className={styles.button}
    type="button"
    data-type={type}
    onClick={onClick}
    aria-label={label}
    title={label}
    disabled={disabled}
    {...rest}
  >
    {children || label}
  </button>
)

export default Button
