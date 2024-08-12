import React, {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import styles from './splitPasswordInput.module.scss'

const SplitPasswordInput = forwardRef(
  (
    {
      values,
      inputCount,
      onChange,
      disabled,
    }: {
      values: (string | undefined)[]
      inputCount?: number
      onChange: (value: string, idx: number) => void
      disabled?: boolean
    },
    handlerRef: ForwardedRef<{ focus: () => void }>
  ) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const [focusIdx, setFocusIdx] = useState<number | undefined>()
    useImperativeHandle(
      handlerRef,
      () => {
        return {
          focus() {
            if (ref.current && focusIdx !== undefined) {
              const currentInput = ref.current.querySelector(`input:nth-child(${focusIdx})`) as HTMLInputElement
              currentInput?.focus()
            }
          },
        }
      },
      [focusIdx, ref]
    )
    const onChangeInput = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
      e => {
        const { dataset, value } = e.currentTarget
        if (value.length > 1 || !dataset.idx) return
        onChange(value, +dataset.idx)
        if (ref.current && value.length > 0) {
          const nextInput = ref.current.querySelector(`input:nth-child(${+dataset.idx + 2})`) as HTMLInputElement
          nextInput?.focus()
          setFocusIdx(+dataset.idx + 2)
        }
      },
      [ref, values]
    )
    const onKeyDown = useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
      e => {
        const { dataset, value } = e.currentTarget
        if (e.key === 'Backspace' && dataset.idx && +dataset.idx > 0 && ref.current && value.length === 0) {
          const lastInput = ref.current.querySelector(`input:nth-child(${+dataset.idx})`) as HTMLInputElement
          lastInput?.focus()
          onChange('', +dataset.idx - 1)
          setFocusIdx(+dataset.idx)
        }
      },
      [ref, values, setFocusIdx]
    )
    useEffect(() => {
      if (ref.current && values.join('').length === 0) {
        const firstInput = ref.current.querySelector(`input:nth-child(1)`) as HTMLInputElement
        firstInput?.focus()
        setFocusIdx(1)
      }
    }, [values, setFocusIdx])
    return (
      <div ref={ref} className={styles.root}>
        {Array.from({ length: inputCount ?? values.length }).map((_, idx) => (
          <input
            // eslint-disable-next-line react/no-array-index-key
            key={idx.toString()}
            value={values[idx]}
            data-idx={idx}
            onChange={onChangeInput}
            maxLength={1}
            type="password"
            onKeyDown={onKeyDown}
            disabled={disabled}
          />
        ))}
      </div>
    )
  }
)

SplitPasswordInput.displayName = 'SplitPasswordInput'
export default SplitPasswordInput
