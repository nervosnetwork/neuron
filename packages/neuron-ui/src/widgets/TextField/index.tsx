import React, { useCallback, useRef, useState } from 'react'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'
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
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
      onClick?: (e: React.SyntheticEvent<HTMLInputElement>) => void
      className?: string
      suffix?: string | React.ReactNode | undefined
      stack?: boolean
      required?: boolean
      readOnly?: boolean
      placeholder?: string

      [key: string]: any
    },
    ref: React.LegacyRef<HTMLDivElement>
  ) => {
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
  const [isActived, changeActivied] = useState(false)
  const focusEdit = useCallback(() => {
    if (rootRef.current && rootRef.current.querySelector('input')) {
      changeEditValue(value)
      rootRef.current.querySelector('input').focus()
    }
    changeActivied(true)
  }, [changeActivied, value])
  const onBlur = useCallback(() => {
    changeActivied(false)
    if (onChange && editedValue !== value) {
      onChange(editedValue)
    }
  }, [onChange, changeActivied, editedValue, value])
  const onChangeFocus = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      changeEditValue(e.target.value)
    },
    [changeEditValue]
  )

  return (
    <TextField
      {...rest}
      ref={rootRef}
      value={isActived ? editedValue : value}
      onBlur={onBlur}
      onChange={isActived ? onChangeFocus : undefined}
      readOnly={!isActived}
      onDoubleClick={focusEdit}
      className={styles.editTextField}
      suffix={
        isActived ? (
          undefined
        ) : (
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
