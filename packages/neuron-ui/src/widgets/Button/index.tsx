import React, { useCallback } from 'react'
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
  const onBtnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick(e)
      ;(e.target as HTMLButtonElement).blur()
    },
    [onClick]
  )

  return (
    <button
      className={`${styles.button} ${className}`}
      type="button"
      data-type={type}
      onClick={onBtnClick}
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
