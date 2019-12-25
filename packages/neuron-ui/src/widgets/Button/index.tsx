import React from 'react'
import styles from './button.module.scss'

const Button = ({
  type = 'default',
  label,
  onClick,
  disabled = false,
  className = '',
  children,
  ...rest
}: {
  type?: 'default' | 'cancel' | 'ok' | 'submit' | 'confirm' | 'primary' | 'reset'
  label: string
  onClick: any
  disabled?: boolean
  className?: string
  children?: React.ReactChild
  [key: string]: any
}) => {
  return (
    <button
      className={`${styles.button} ${className}`}
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
}

export default Button
