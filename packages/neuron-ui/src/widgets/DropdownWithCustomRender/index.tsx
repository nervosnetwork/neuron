import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LineDownArrow } from 'widgets/Icons/icon'
import { ReactComponent as Select } from 'widgets/Icons/Select.svg'

import styles from './index.module.scss'

export interface OptionProps {
  label: string | React.ReactNode
  value: string
  className?: string
  index?: number
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

const DropdownWithCustomRender = ({
  options: optionsFromProps,
  onChange,
  value: valueFromProps = '',
  placeholder,
  onFocus,
  disabled,
  className,
}: DropdownWithCustomRenderProps) => {
  const [t] = useTranslation()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const DEFAULT_PLACEHOLDER_STRING = t('dropdown.placeholder')

  // render selected value in options
  const parseValue = (value: string, options: OptionProps[]) => {
    const option = options.find(v => v?.value === value)

    return (
      option || {
        label: placeholder ?? DEFAULT_PLACEHOLDER_STRING,
        value: '',
      }
    )
  }

  const selectedOption = useMemo(() => parseValue(valueFromProps, optionsFromProps), [valueFromProps, optionsFromProps])

  const setValue = useCallback(
    ({ value, label, index }: OptionProps) => {
      const newState = {
        value,
        label,
        index,
      }
      onChange?.(newState)
      setIsOpen(false)
    },
    [onChange, setIsOpen]
  )

  const handleDocumentClick = (event: MouseEvent | TouchEvent) => {
    if (!dropdownRef.current?.contains(event.target as HTMLElement)) {
      setIsOpen(false)
    }
  }

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    if (typeof onFocus === 'function') {
      onFocus(isOpen)
    }
    if (event.type === 'mousedown' && (event as React.MouseEvent<HTMLDivElement>).button !== 0) {
      return
    }
    event.stopPropagation()
    event.preventDefault()

    if (!disabled) {
      setIsOpen(openState => !openState)
    }
  }

  const isValueSelected = selectedOption.value !== ''
  const dropdownLabelOrPlaceholder = selectedOption.label || DEFAULT_PLACEHOLDER_STRING

  const disabledClass = disabled ? `${styles['dropdown-disabled']}` : ''
  const dropdownClass = `${styles['dropdown-root']} ${className} ${isOpen ? styles['is-open'] : ''}`
  const controlClass = `${styles['dropdown-control']} ${disabledClass}`
  const placeholderClass = `${styles['dropdown-placeholder']} ${isValueSelected ? styles['is-selected'] : ''}`
  const arrowClass = `${styles['dropdown-arrow']}`
  const menuClass = `${styles['dropdown-menu']}`

  const renderOption = useCallback(
    (option: OptionProps) => {
      const { value, label, className: optionClassName, index } = option
      const isSelected = value === selectedOption.value
      const optionClass = `${styles['dropdown-option']} ${optionClassName} ${isSelected ? styles['is-selected'] : ''}`

      const renderedValue = {
        value,
        label,
        index,
      }

      return (
        <div
          key={value}
          className={optionClass}
          onMouseDown={() => setValue(renderedValue)}
          onClick={() => setValue(renderedValue)}
          onKeyDown={() => setValue(renderedValue)}
          role="option"
          tabIndex={0}
          aria-selected={isSelected ? 'true' : 'false'}
        >
          {label}
          {isSelected ? <Select /> : null}
        </div>
      )
    },
    [selectedOption, setValue]
  )

  const menu = useMemo(() => {
    const buildMenu = () => {
      const ops = optionsFromProps.map((option, index) => renderOption({ ...option, index }))

      return ops.length ? ops : <div className={`${styles['dropdown-noresults']}`}>No options found</div>
    }

    return isOpen ? (
      <div className={menuClass} aria-expanded="true">
        {buildMenu()}
      </div>
    ) : null
  }, [isOpen, optionsFromProps, renderOption])

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, false)
    document.addEventListener('touchend', handleDocumentClick, false)

    return () => {
      document.removeEventListener('click', handleDocumentClick, false)
      document.removeEventListener('touchend', handleDocumentClick, false)
    }
  }, [])

  return (
    <div ref={dropdownRef} className={dropdownClass}>
      <div
        className={controlClass}
        onMouseDown={handleMouseDown}
        onTouchEnd={handleMouseDown}
        role="textbox"
        tabIndex={0}
        aria-haspopup="listbox"
      >
        <div className={placeholderClass}>{dropdownLabelOrPlaceholder}</div>
        <LineDownArrow className={arrowClass} />
      </div>
      {menu}
    </div>
  )
}

DropdownWithCustomRender.displayName = 'DropdownWithCustomRender'

export default React.memo(DropdownWithCustomRender)
