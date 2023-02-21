import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { LineDownArrow } from 'widgets/Icons/icon'

import styles from './index.module.scss'

export interface OptionProps {
  label: string | ReactNode
  value: string
  className?: string
  data?: Record<string, string | number>
}

interface DropdownWithCustomRenderProps {
  onChange: (changeValue: OptionProps) => void
  options: OptionProps[]
  value?: string
  placeholder?: string
  onFocus?: (isOpen: boolean) => void
  disabled?: boolean
  className?: string
}

const DEFAULT_PLACEHOLDER_STRING = 'Please select...'

const DropdownWithCustomRender = ({
  options: optionsFromProps,
  onChange,
  value: valueFromProps = '',
  placeholder,
  onFocus,
  disabled,
  className,
}: DropdownWithCustomRenderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(true)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const parseValue = (value: string, options: OptionProps[]) => {
    let option

    if (typeof value === 'string') {
      for (let i = 0, num = options.length; i < num; i++) {
        if (typeof options[i].value !== 'undefined' && options[i].value === value) {
          option = options[i]
        }
      }
    }

    return option
  }

  const [selectedValue, setSelectedValue] = useState(
    parseValue(valueFromProps, optionsFromProps) || {
      label: typeof placeholder === 'undefined' ? DEFAULT_PLACEHOLDER_STRING : placeholder,
      value: '',
    }
  )

  const fireChangeEvent = (newState: OptionProps) => {
    if (newState !== selectedValue && onChange) {
      onChange(newState)
    }
  }

  const setValue = ({ value, label }: OptionProps) => {
    const newState = {
      value,
      label,
    }
    fireChangeEvent(newState)
    setSelectedValue(newState)
    setIsOpen(false)
  }

  const handleDocumentClick = (event: any) => {
    if (isMounted) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
  }

  const handleMouseDown = (event: any) => {
    if (onFocus && typeof onFocus === 'function') {
      onFocus(isOpen)
    }
    if (event.type === 'mousedown' && event.button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()

    if (!disabled) {
      setIsOpen(openState => !openState)
    }
  }

  const renderOption = (option: OptionProps) => {
    const { value, label, data, className: optionClassName } = option
    const isSelected = value === selectedValue.value
    const optionClass = `${styles['dropdown-option']} ${optionClassName} ${isSelected ? styles['is-selected'] : ''}`

    const dataAttributes =
      (data &&
        Object.keys(data).reduce(
          (acc, dataKey) => ({
            ...acc,
            [`data-${dataKey}`]: data[dataKey],
          }),
          {}
        )) ||
      {}

    return (
      <div
        key={value}
        className={optionClass}
        onMouseDown={() => setValue({ value, label })}
        onClick={() => setValue({ value, label })}
        onKeyDown={() => setValue({ value, label })}
        role="option"
        tabIndex={0}
        aria-selected={isSelected ? 'true' : 'false'}
        {...dataAttributes}
      >
        {label}
      </div>
    )
  }

  const buildMenu = () => {
    const ops = optionsFromProps.map(option => renderOption(option))

    return ops.length ? ops : <div className={`${styles['dropdown-noresults']}`}>No options found</div>
  }

  const isValueSelected = selectedValue.value !== ''

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, false)
    document.addEventListener('touchend', handleDocumentClick, false)

    return () => {
      setIsMounted(false)
      document.removeEventListener('click', handleDocumentClick, false)
      document.removeEventListener('touchend', handleDocumentClick, false)
    }
  }, [])

  const placeHolderValue = selectedValue.label || DEFAULT_PLACEHOLDER_STRING

  const disabledClass = disabled ? `${styles['dropdown-disabled']}` : ''
  const dropdownClass = `${styles['dropdown-root']} ${className} ${isOpen ? styles['is-open'] : ''}`
  const controlClass = `${styles['dropdown-control']} ${disabledClass}`
  const placeholderClass = `${styles['dropdown-placeholder']} ${isValueSelected ? styles['is-selected'] : ''}`
  const arrowClass = `${styles['dropdown-arrow']}`
  const menuClass = `${styles['dropdown-menu']}`

  const inputValue = <div className={placeholderClass}>{placeHolderValue}</div>
  const menu = isOpen ? (
    <div className={menuClass} aria-expanded="true">
      {buildMenu()}
    </div>
  ) : null

  return (
    <div ref={dropdownRef} className={dropdownClass}>
      <div
        className={controlClass}
        onMouseDown={e => handleMouseDown(e)}
        onTouchEnd={e => handleMouseDown(e)}
        role="textbox"
        tabIndex={0}
        aria-haspopup="listbox"
      >
        {inputValue}
        <LineDownArrow className={arrowClass} />
      </div>
      {menu}
    </div>
  )
}

DropdownWithCustomRender.displayName = 'DropdownWithCustomRender'

export default React.memo(DropdownWithCustomRender)
