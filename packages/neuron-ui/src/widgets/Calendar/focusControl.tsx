import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { isMonthInRange, isDayInRange } from './utils'

type ButtonHasFocusProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { isFocus: boolean }
export const ButtonHasFocus = ({ isFocus, children, ...props }: ButtonHasFocusProps) => {
  const ref = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (isFocus && ref.current) {
      ref.current.focus()
    }
  }, [isFocus])

  return (
    // eslint-disable-next-line react/button-has-type
    <button {...props} ref={ref} tabIndex={isFocus ? 0 : -1}>
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
  }, [value])

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
  year: number,
  month: number,
  prevMonth: () => void,
  nextMonth: () => void,
  onChange: (value: Date) => void
) => {
  const [focusDate, setFocusDate] = useState(value || new Date())

  function moveNextMonth() {
    if (isMonthInRange(focusDate.getFullYear(), focusDate.getMonth() + 2, { minDate, maxDate })) {
      nextMonth()
    }
  }
  function movePrevMonth() {
    if (isMonthInRange(focusDate.getFullYear(), focusDate.getMonth(), { minDate, maxDate })) {
      prevMonth()
    }
  }
  function moveDate(diff: number) {
    const date = new Date(focusDate)
    date.setDate(date.getDate() + diff)
    if (date.getMonth() !== focusDate.getMonth() && date > focusDate) {
      moveNextMonth()
    }
    if (date.getMonth() !== focusDate.getMonth() && date < focusDate) {
      movePrevMonth()
    }
    if (isDayInRange(date, { minDate, maxDate })) {
      setFocusDate(date)
    }
  }
  function moveBackward(date: Date) {
    if (isDayInRange(date, { minDate, maxDate })) {
      setFocusDate(date)
    } else {
      setFocusDate(minDate as Date)
    }
  }
  function moveForward(date: Date) {
    if (isDayInRange(date, { minDate, maxDate })) {
      setFocusDate(date)
    } else {
      setFocusDate(maxDate as Date)
    }
  }

  useEffect(() => {
    setFocusDate(value || new Date())
  }, [value?.toDateString()])

  useEffect(() => {
    if (focusDate.getFullYear() !== year || focusDate.getMonth() + 1 !== month) {
      moveBackward(new Date(year, month - 1, 1))
    }
  }, [year, month])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const keyEventMap = {
      Enter: () => onChange(focusDate),
      ' ': () => onChange(focusDate),

      ArrowLeft: () => moveDate(-1),
      ArrowRight: () => moveDate(1),
      ArrowUp: () => moveDate(-7),
      ArrowDown: () => moveDate(7),

      PageUp() {
        movePrevMonth()
        const date = new Date(focusDate)
        date.setMonth(focusDate.getMonth() - 1)
        moveBackward(date)
      },
      PageDown() {
        moveNextMonth()
        const date = new Date(focusDate)
        date.setMonth(focusDate.getMonth() + 1)
        moveForward(date)
      },
      Home() {
        const date = new Date(focusDate)
        date.setDate(1)
        moveBackward(date)
      },
      End() {
        const date = new Date(focusDate)
        date.setMonth(focusDate.getMonth() + 1)
        date.setDate(0)
        moveForward(date)
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

export default useTableFocusControl
