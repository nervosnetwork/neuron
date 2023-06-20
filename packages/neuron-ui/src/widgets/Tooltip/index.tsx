import React, { useCallback, useState } from 'react'
import styles from './tooltip.module.scss'

export type Placement = 'top' | 'right' | 'left' | 'bottom' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom'

interface TooltipProps {
  tip: React.ReactNode
  className?: string
  tipClassName?: string
  placement?: Placement
  center?: boolean
  trigger?: 'hover' | 'click'
  type?: 'normal' | 'always-dark'
  showTriangle?: boolean
  isTriggerNextToChild?: boolean
}
const Tooltip: React.FC<TooltipProps> = ({
  children,
  tip,
  className = '',
  tipClassName = '',
  placement = 'bottom',
  center = true,
  trigger = 'hover',
  type = 'normal',
  showTriangle,
  isTriggerNextToChild,
}) => {
  const [isTipShow, setIsTipShow] = useState(false)
  const onChangeIsTipShow = useCallback(() => {
    setIsTipShow(v => !v)
  }, [setIsTipShow])
  if (typeof tip === 'string') {
    return (
      <div
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
      <div className={`${styles.tip} ${tipClassName}`}>
        {tip}
        {showTriangle && <div className={styles.triangle} />}
      </div>
      {children}
    </div>
  )
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
