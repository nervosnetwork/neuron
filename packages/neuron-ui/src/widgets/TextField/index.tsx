import React from 'react'
import styles from './textField.module.scss'

const TextField = ({
  label,
  field,
  value,
  error,
  onChange,
  onClick,
  type = 'text',
  className = '',
  placeholder = '',
  stack = true,
  required = false,
  readOnly = false,
}: {
  field: string
  label?: string
  value?: string
  error?: string
  type?: 'text' | 'password' | 'file'
  onChange?: (e: React.SyntheticEvent<HTMLInputElement>) => void
  onClick?: (e: React.SyntheticEvent<HTMLInputElement>) => void
  className?: string
  stack?: boolean
  required?: boolean
  readOnly?: boolean
  placeholder?: string
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
      />
      {error ? <span className={styles.errorMessage}>{error}</span> : null}
    </div>
  )
}

TextField.displayName = 'TextField'
export default TextField
