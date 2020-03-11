import React from 'react'
import styles from './button.module.scss'

const isNativeType = (type: string): type is 'button' | 'submit' | 'reset' => {
  return ['button', 'submit', 'reset'].includes(type)
}

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
  onClick?: any
  disabled?: boolean
  className?: string
  children?: React.ReactChild
  [key: string]: any
}) => {
  const btnType = isNativeType(type) ? type : 'button'

  return (
    // eslint-disable-next-line react/button-has-type
    <button
      className={`${styles.button} ${className}`}
      type={btnType}
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
