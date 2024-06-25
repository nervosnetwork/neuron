import React, { useCallback, useState, useRef, type CSSProperties } from 'react'
import { useDidMount } from 'utils'
import styles from './tooltip.module.scss'

export type Placement = 'top' | 'right' | 'left' | 'bottom' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom'

interface TooltipProps {
  tip: React.ReactNode
  className?: string
  tipClassName?: string
  tipStyles?: CSSProperties
  placement?: Placement
  center?: boolean
  trigger?: 'hover' | 'click'
  type?: 'normal' | 'always-dark'
  showTriangle?: boolean
  isTriggerNextToChild?: boolean
  onVisibleChange?: (visible: boolean) => void
}
const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  children,
  tip,
  className = '',
  tipClassName = '',
  tipStyles,
  placement = 'bottom',
  center = true,
  trigger = 'hover',
  type = 'normal',
  showTriangle,
  isTriggerNextToChild,
  onVisibleChange,
}) => {
  const [isTipShow, setIsTipShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const onChangeIsTipShow = useCallback(() => {
    setIsTipShow(v => {
      onVisibleChange?.(!v)
      return !v
    })
  }, [setIsTipShow, onVisibleChange])

  const onDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) {
        setIsTipShow(false)
        onVisibleChange?.(false)
      }
    },
    [isTipShow]
  )

  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })

  if (typeof tip === 'string') {
    return (
      <div
        ref={ref}
        className={`${styles.tipWithString} ${className}`}
        data-tooltip={tip}
        data-placement={placement}
        data-placement-center={center}
        data-trigger={trigger}
        onClick={trigger === 'click' ? onChangeIsTipShow : undefined}
        data-tip-show={isTipShow}
        onKeyPress={undefined}
        data-type={type}
        data-has-trigger={showTriangle}
        data-trigger-next-to-child={isTriggerNextToChild}
      >
        {children}
        {showTriangle && <div className={styles.triangle} />}
      </div>
    )
  }
  return (
    <div
      ref={ref}
      className={`${styles.tipWithNode} ${className}`}
      data-placement={placement}
      data-placement-center={center}
      data-trigger={trigger}
      onClick={trigger === 'click' ? onChangeIsTipShow : undefined}
      data-tip-show={isTipShow}
      onKeyPress={undefined}
      data-type={type}
      data-has-trigger={showTriangle}
      data-trigger-next-to-child={isTriggerNextToChild}
    >
      <div className={`${styles.tip} ${tipClassName}`} style={tipStyles}>
        {tip}
        {showTriangle && <div className={styles.triangle} />}
      </div>
      {children}
    </div>
  )
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
