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
  onChange?: (arg: string) => void
  defaultValue?: string | number
  value?: string | number
  itemClassName?: string
  className?: string
  inputIdPrefix?: string
}

const RadioGroup = ({
  defaultValue,
  options,
  onChange,
  itemClassName = '',
  className = '',
  value,
  inputIdPrefix = '',
}: RadioGroupProps) => {
  const [checkedValue, setCheckedValue] = useState(defaultValue ?? options[0]?.value)

  const handleChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value: selectedValue } = e.target as HTMLInputElement
      if (selectedValue !== value ?? checkedValue) {
        setCheckedValue(selectedValue)
        onChange?.(selectedValue)
      }
    },
    [onChange, checkedValue, setCheckedValue, value]
  )

  return (
    <div className={className}>
      {options.map(item => (
        <div key={item.value}>
          <div className={`${styles.item} ${itemClassName}`}>
            <label htmlFor={`${inputIdPrefix}_${item.value}`}>
              <input
                id={`${inputIdPrefix}_${item.value}`}
                type="radio"
                value={item.value}
                checked={item.value === (value ?? checkedValue)}
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
