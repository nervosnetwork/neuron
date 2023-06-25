import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useDidMount, useForceUpdate } from 'utils'
import styles from './input-select.module.scss'

export interface SelectOptions {
  label: React.ReactNode
  value: string
  data?: any
  className?: string
}

export interface InputSelectProps {
  options: SelectOptions[]
  className?: string
  disabled?: boolean
  onChange?: (value: string, arg?: SelectOptions) => void
  value?: string
  placeholder?: string
  inputDisabeld?: boolean
}

function parseValue(value: string, options: SelectOptions[]) {
  const option = options.find(o => o.value === value)
  return option?.value || value
}

const Select = ({ value, options, placeholder, disabled, onChange, className, inputDisabeld }: InputSelectProps) => {
  const mounted = useRef(true)
  const root = useRef<HTMLDivElement>(null)
  const openRef = useRef<boolean>(false)
  const setOpen = useForceUpdate((isOpen: boolean) => {
    openRef.current = isOpen
  })
  const [innerValue, setInnerValue] = useState<string>('')

  const onDocumentClick = useCallback(
    (e: any) => {
      if (mounted.current && !root.current?.contains(e.target) && openRef.current) {
        setOpen(false)
      }
    },
    [openRef, setOpen]
  )

  const onMouseDown = useCallback(() => {
    if (!disabled) {
      setOpen(!openRef.current)
    }
  }, [openRef, disabled, setOpen])

  const setValue = useCallback(
    (option: SelectOptions) => {
      if (onChange) {
        onChange(option.value, option)
      }

      setInnerValue(option.value)
      setOpen(false)
    },
    [onChange, setInnerValue, setOpen]
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value)
      }

      setInnerValue(e.target.value)
      setOpen(false)
    },
    [setInnerValue, setOpen, onChange]
  )
  const renderOption = useCallback(
    (option: SelectOptions) => {
      const { value: val } = option
      const label: React.ReactNode = option.label || option.value
      const isSelected = val === innerValue

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
    [innerValue, setValue]
  )

  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })

  useEffect(() => {
    if (value !== undefined) {
      const nextSelected = parseValue(value, options)
      setInnerValue(nextSelected)
    } else {
      setInnerValue('')
    }
  }, [value, placeholder, options])

  const disabledClass = disabled ? styles.disabled : ''
  const dropdownClass = `${className || ''} ${styles.root} ${openRef.current ? styles.isOpen : ''}`
  const controlClass = `${styles.control} ${disabledClass} ${openRef.current ? styles.isOpen : ''}`
  const placeholderClass = `${styles.placeholder} ${innerValue !== '' ? styles.isSelected : ''}`

  return (
    <div className={dropdownClass} ref={root}>
      <div
        className={controlClass}
        onMouseDown={onMouseDown}
        onTouchEnd={onMouseDown}
        role="button"
        tabIndex={0}
        data-open={openRef.current}
      >
        <input
          disabled={inputDisabeld}
          className={placeholderClass}
          onChange={onInputChange}
          value={value ?? innerValue}
        />
        <div className={styles.arrow} />
      </div>
      {openRef.current ? (
        <div className={styles.menu} aria-expanded="true">
          {options.map(option => renderOption(option))}
        </div>
      ) : null}
    </div>
  )
}

Select.displayName = 'Select'

export default Select
