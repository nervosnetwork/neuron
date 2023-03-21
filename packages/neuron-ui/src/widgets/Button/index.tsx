import React from 'react'
import clsx from 'clsx'
import styles from './button.module.scss'

const isNativeType = (type: string): type is 'button' | 'submit' | 'reset' => {
  return ['button', 'submit', 'reset'].includes(type)
}

const Button = React.forwardRef(
  (
    {
      type = 'default',
      label,
      onClick,
      disabled = false,
      className = '',
      children,
      ...rest
    }: {
      type?: 'default' | 'cancel' | 'ok' | 'submit' | 'confirm' | 'primary' | 'reset' | 'text'
      label?: string
      onClick?: any
      disabled?: boolean
      className?: string
      children?: React.ReactChild
      [key: string]: any
    },
    ref: React.LegacyRef<HTMLButtonElement>
  ) => {
    const btnType = isNativeType(type) ? type : 'button'

    return (
      <button
        ref={ref}
        className={clsx(styles.button, className)}
        // eslint-disable-next-line react/button-has-type
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
)

export default Button
