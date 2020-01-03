import React from 'react'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import styles from './textField.module.scss'

const TextField = ({
  label,
  field,
  value,
  hint,
  error,
  onChange,
  onClick,
  type = 'text',
  className = '',
  placeholder = '',
  suffix,
  stack = true,
  required = false,
  readOnly = false,
  ...rest
}: {
  field: string
  label?: string
  value?: string
  hint?: string
  error?: string
  type?: 'text' | 'password' | 'file'
  onChange?: (e: React.SyntheticEvent<HTMLInputElement>) => void
  onClick?: (e: React.SyntheticEvent<HTMLInputElement>) => void
  className?: string
  suffix?: string | React.ReactNode | undefined
  stack?: boolean
  required?: boolean
  readOnly?: boolean
  placeholder?: string

  [key: string]: any
}) => {
  return (
    <div
      className={`${styles.textField} ${stack ? styles.stack : ''} ${className}`}
      data-required={required}
      data-has-error={!!error}
    >
      {label ? (
        <label htmlFor={field} aria-label={label} title={label}>
          {label}
        </label>
      ) : null}
      <div className={styles.input}>
        <input
          id={field}
          data-field={field}
          type={type}
          value={value}
          placeholder={placeholder}
          title={label}
          name={label}
          arial-label={label}
          onChange={onChange}
          onClick={onClick}
          readOnly={readOnly}
          {...rest}
        />
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </div>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {error ? (
        <span className={styles.errorMessage}>
          <Attention />
          {error}
        </span>
      ) : null}
    </div>
  )
}

TextField.displayName = 'TextField'
export default TextField
