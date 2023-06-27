import React, { useCallback, useRef, useState } from 'react'
import Alert from 'widgets/Alert'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'
import { PasswordHide, PasswordShow } from 'widgets/Icons/icon'
import styles from './textField.module.scss'

const TextField = React.forwardRef(
  (
    {
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
      prefix,
      stack = true,
      required = false,
      readOnly = false,
      disabled,
      selected,
      width,
      rows = 1,
      ...rest
    }: {
      field: string
      label?: string
      value?: string
      hint?: string
      error?: string
      type?: 'text' | 'password' | 'file'
      onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
      onClick?: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => void
      className?: string
      prefix?: string | React.ReactNode | undefined
      suffix?: string | React.ReactNode | undefined
      stack?: boolean
      required?: boolean
      readOnly?: boolean
      placeholder?: string
      disabled?: boolean
      selected?: boolean
      [key: string]: any
      width?: string
      rows?: number
    },
    ref: React.LegacyRef<HTMLDivElement>
  ) => {
    const [isPasswordHidden, setIsPasswordHidden] = useState(true)
    const changePasswordHide = useCallback(() => {
      setIsPasswordHidden(v => !v)
    }, [setIsPasswordHidden])
    return (
      <div
        className={`${styles.textField} ${stack ? styles.stack : ''} ${className}`}
        data-required={required}
        data-has-error={!!error}
        ref={ref}
      >
        {label ? (
          <label htmlFor={field} aria-label={label} title={label}>
            {label}
          </label>
        ) : null}
        <div
          style={{ ...(width ? { width } : '') }}
          className={styles.input}
          data-disabled={disabled}
          data-type={type}
          data-selected={selected}
        >
          {prefix && (typeof prefix === 'string' ? <span className={styles.prefix}>{prefix}</span> : prefix)}
          {rows > 1 ? (
            <textarea
              id={field}
              data-field={field}
              rows={rows}
              value={value}
              placeholder={placeholder}
              title={label}
              name={label}
              aria-label={label}
              onChange={onChange}
              onClick={onClick}
              readOnly={readOnly}
              disabled={disabled}
              {...rest}
            />
          ) : (
            <input
              id={field}
              data-field={field}
              type={!isPasswordHidden && type === 'password' ? 'text' : type}
              value={value}
              placeholder={placeholder}
              title={label}
              name={label}
              aria-label={label}
              onChange={onChange}
              onClick={onClick}
              readOnly={readOnly}
              disabled={disabled}
              {...rest}
            />
          )}
          {suffix && (typeof suffix === 'string' ? <span className={styles.suffix}>{suffix}</span> : suffix)}
          {!suffix && type === 'password' && (
            <span
              className={`${styles.suffix} ${styles.password}`}
              onClick={changePasswordHide}
              role="button"
              aria-hidden="true"
              tabIndex={0}
            >
              {isPasswordHidden ? <PasswordHide /> : <PasswordShow />}
            </span>
          )}
        </div>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
        {error ? (
          <Alert status="error" className={styles.errorMessage} withIcon={false}>
            {error}
          </Alert>
        ) : null}
      </div>
    )
  }
)

export const EditTextField = ({
  value,
  onChange,
  ...rest
}: {
  value: string
  onChange?: (value: string | undefined) => void
} & React.ComponentPropsWithRef<typeof TextField>) => {
  const rootRef = useRef<any>()
  const [editedValue, changeEditValue] = useState<string | undefined>('')
  const [isActive, changeActive] = useState(false)
  const focusEdit = useCallback(() => {
    if (rootRef.current && rootRef.current.querySelector('input')) {
      changeEditValue(value)
      rootRef.current.querySelector('input').focus()
    }
    changeActive(true)
  }, [changeActive, value])
  const onBlur = useCallback(() => {
    if (isActive) {
      changeActive(false)
      if (onChange && editedValue !== value) {
        onChange(editedValue)
      }
    }
  }, [onChange, changeActive, editedValue, value])
  const onChangeFocus = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      changeEditValue(e.target.value)
    },
    [changeEditValue]
  )

  return (
    <TextField
      {...rest}
      ref={rootRef}
      value={isActive ? editedValue : value}
      onBlur={onBlur}
      onChange={isActive ? onChangeFocus : undefined}
      readOnly={!isActive}
      onDoubleClick={focusEdit}
      className={styles.editTextField}
      suffix={
        isActive ? undefined : (
          <button type="button" onClick={focusEdit} className={styles.editBtn}>
            <Edit />
          </button>
        )
      }
    />
  )
}
TextField.displayName = 'TextField'
export default TextField
