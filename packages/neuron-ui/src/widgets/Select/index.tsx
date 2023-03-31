import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useDidMount } from 'utils'
import styles from './select.module.scss'

export interface SelectOptions {
  label: React.ReactNode
  value: string
  data?: any
  className?: string
}

export interface SelectProps {
  options: SelectOptions[]
  // eslint-disable-next-line react/no-unused-prop-types
  className?: string
  disabled?: boolean
  onChange?: (arg: SelectOptions) => void
  value?: SelectOptions | string
  placeholder?: string
}

function parseValue(value: string | SelectOptions, options: SelectOptions[]) {
  const option = options.find(o => o.value === value)
  return option || value
}

const Select = ({ value, options, placeholder, disabled, onChange }: SelectProps) => {
  const mounted = useRef(true)
  const root = useRef<HTMLDivElement>(null)
  const [isOpen, setOpen] = useState(false)
  const [selected, setSelected] = useState<SelectOptions>({
    label: placeholder ?? '',
    value: '',
  })

  const onDocumentClick = useCallback(
    (e: any) => {
      if (mounted.current && !root.current?.contains(e.target) && isOpen) {
        setOpen(false)
      }
    },
    [isOpen]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()
      if (!disabled) {
        setOpen(!isOpen)
      }
    },
    [isOpen, disabled]
  )

  const setValue = useCallback(
    (option: SelectOptions) => {
      if (onChange) {
        onChange(option)
      }

      setSelected(option)
      setOpen(false)
    },
    [onChange]
  )

  const renderOption = useCallback(
    (option: SelectOptions) => {
      const { value: val } = option
      const label: React.ReactNode = option.label || option.value
      const isSelected = val === selected.value

      return (
        <div
          className={styles.option}
          key={val}
          onClick={setValue.bind(null, option)}
          role="option"
          aria-selected={isSelected ? 'true' : 'false'}
          aria-hidden="true"
        >
          {label}
        </div>
      )
    },
    [selected.value, setValue]
  )

  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })

  useEffect(() => {
    if (value) {
      const nextSelected = parseValue(value, options)
      setSelected(nextSelected as SelectOptions)
    } else {
      setSelected({
        label: placeholder ?? '',
        value: '',
      })
    }
  }, [value, placeholder, options])

  const disabledClass = disabled ? styles.disabled : ''
  const placeHolderValue = selected.label
  const dropdownClass = `${styles.root} ${isOpen ? styles.isOpen : ''}`
  const controlClass = `${styles.control} ${disabledClass} ${isOpen ? styles.isOpen : ''}`
  const placeholderClass = `${styles.placeholder} ${selected.value !== '' ? styles.isSelected : ''}`

  return (
    <div className={dropdownClass} ref={root}>
      <div
        className={controlClass}
        onMouseDown={onMouseDown}
        onTouchEnd={onMouseDown}
        role="button"
        tabIndex={0}
        data-open={isOpen}
      >
        <div className={placeholderClass}>{placeHolderValue}</div>
        <div className={styles.arrowWrapper}>
          <span className={styles.arrow} />
        </div>
      </div>
      {isOpen ? (
        <div className={styles.menu} aria-expanded="true">
          {options.map(option => renderOption(option))}
        </div>
      ) : null}
    </div>
  )
}

Select.displayName = 'Select'

export default Select
