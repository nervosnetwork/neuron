import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { isMonthInRange, isDayInRange } from './utils'

type ButtonHasFocusProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isFocusable: boolean
  isMoveFocus: boolean
}
export const ButtonHasFocus = ({ isFocusable, isMoveFocus, children, ...props }: ButtonHasFocusProps) => {
  const ref = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (isFocusable && isMoveFocus && ref.current) {
      ref.current.focus()
    } else {
      // ignore
    }
  }, [isFocusable, isMoveFocus])

  return (
    // eslint-disable-next-line react/button-has-type
    <button {...props} ref={ref} tabIndex={isFocusable ? 0 : -1}>
      {children}
    </button>
  )
}

interface Option {
  value: number
  title: string
  label: string
  selectable: boolean
}
export const useSelectorFocusControl = (value: number, options: Option[], onChange: (option: Option) => void) => {
  const [focusIndex, setFocusIndex] = useState(-1)

  useEffect(() => {
    setFocusIndex(options.findIndex(option => option.value === value))
  }, [value, options])

  function moveBackward() {
    const index = focusIndex - 1
    if (options[index].selectable) {
      setFocusIndex(index)
    }
  }
  function moveForward() {
    const index = focusIndex + 1
    if (options[index].selectable) {
      setFocusIndex(index)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const keyEventMap = {
      Enter: () => onChange(options[focusIndex]),
      ' ': () => onChange(options[focusIndex]),

      ArrowLeft: () => moveBackward(),
      ArrowRight: () => moveForward(),
      ArrowUp: () => moveBackward(),
      ArrowDown: () => moveForward(),
    }
    if (Object.keys(keyEventMap).includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()

      keyEventMap[e.key as keyof typeof keyEventMap]()
    }
  }

  return { focusIndex, onKeyDown }
}

export const useTableFocusControl = (
  value: Date | undefined,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  calendarYear: number,
  calendarMonth: number,
  setYear: (month: number) => void,
  setMonth: (month: number) => void,
  onChange: (value: Date) => void
) => {
  const [focusDate, setFocusDate] = useState(value || new Date())
  const curFocusYear = focusDate.getFullYear()
  const curFocusMonth = focusDate.getMonth() + 1
  const curFocusDate = focusDate.getDate()

  function moveDate(year: number, month: number, date: number) {
    if (!isMonthInRange(year, month, { minDate, maxDate })) {
      return
    }
    setYear(year)
    setMonth(month)

    const daysInMonth = new Date(year, month, 0).getDate()
    const instance = new Date(year, month - 1, daysInMonth < date ? daysInMonth : date)

    if (!isDayInRange(instance, { minDate, maxDate })) {
      if (isDayInRange(instance, { minDate })) {
        setFocusDate(maxDate as Date)
      } else {
        setFocusDate(minDate as Date)
      }
    } else {
      setFocusDate(instance)
    }
  }

  function moveDateDiff(diff: number) {
    const instance = new Date(focusDate)
    instance.setDate(instance.getDate() + diff)
    moveDate(instance.getFullYear(), instance.getMonth() + 1, instance.getDate())
  }

  useEffect(() => {
    const instance = value || new Date()
    moveDate(instance.getFullYear(), instance.getMonth() + 1, instance.getDate())
  }, [value?.toDateString(), minDate?.toDateString(), maxDate?.toDateString()])

  useEffect(() => {
    moveDate(calendarYear, calendarMonth, focusDate.getDate())
  }, [calendarYear, calendarMonth, minDate?.toDateString(), maxDate?.toDateString()])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const keyEventMap = {
      Enter: () => onChange(focusDate),
      ' ': () => onChange(focusDate),

      ArrowLeft: () => moveDateDiff(-1),
      ArrowRight: () => moveDateDiff(1),
      ArrowUp: () => moveDateDiff(-7),
      ArrowDown: () => moveDateDiff(7),

      PageUp() {
        if (curFocusMonth <= 1) {
          moveDate(curFocusYear - 1, 12, curFocusDate)
        } else {
          moveDate(curFocusYear, curFocusMonth - 1, curFocusDate)
        }
      },
      PageDown() {
        if (curFocusMonth >= 12) {
          moveDate(curFocusYear + 1, 1, curFocusDate)
        } else {
          moveDate(curFocusYear, curFocusMonth + 1, curFocusDate)
        }
      },
      Home() {
        moveDate(curFocusYear, curFocusMonth, 1)
      },
      End() {
        moveDate(curFocusYear, curFocusMonth, 100)
      },
    }

    if (Object.keys(keyEventMap).includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()

      keyEventMap[e.key as keyof typeof keyEventMap]()
    }
  }

  return { focusDate, onKeyDown }
}

export const useFocusObserve = () => {
  const [isComponetFocused, setIsComponetFocused] = useState(false)

  const onFocus = () => setIsComponetFocused(true)
  const onBlur = () => setIsComponetFocused(false)

  return { isComponetFocused, onFocus, onBlur }
}
