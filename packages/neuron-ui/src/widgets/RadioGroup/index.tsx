import React, { useCallback, useState } from 'react'
import styles from './radioGroup.module.scss'

export interface RadioGroupOptions {
  label: React.ReactNode | string
  value: string
  disabled?: boolean
  suffix?: React.ReactNode | string
  tip?: React.ReactNode | string
}

export interface RadioGroupProps {
  options: RadioGroupOptions[]
  onChange?: (arg: string | number) => void
  defaultValue?: string | number
  itemClassName?: string
  className?: string
}

const RadioGroup = ({ defaultValue, options, onChange, itemClassName = '', className = '' }: RadioGroupProps) => {
  const [checkedValue, setCheckedValue] = useState(defaultValue || options[0].value)

  const handleChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      if (value !== checkedValue) {
        setCheckedValue(value)
        onChange?.(value)
      }
    },
    [onChange, checkedValue, setCheckedValue]
  )

  return (
    <div className={className}>
      {options.map(item => (
        <div>
          <div className={`${styles.item} ${itemClassName}`} key={item.value}>
            <label htmlFor={item.value}>
              <input
                id={item.value}
                type="radio"
                value={item.value}
                checked={item.value === checkedValue}
                disabled={item.disabled}
                onChange={handleChange}
              />
              <span>{item.label}</span>
            </label>
            {item.suffix ? <div>{item.suffix}</div> : null}
          </div>
          {item.tip ? <div>{item.tip}</div> : null}
        </div>
      ))}
    </div>
  )
}

RadioGroup.displayName = 'RadioGroup'

export default RadioGroup
