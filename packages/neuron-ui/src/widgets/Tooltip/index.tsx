import React from 'react'
import styles from './tooltip.module.scss'

export type Placement = 'top' | 'right' | 'left' | 'bottom' | 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom'

const Tooltip: React.FC<{ tip: React.ReactNode; className?: string; placement?: Placement; center?: boolean }> = ({
  children,
  tip,
  className,
  placement = 'bottom',
  center = true,
}) => {
  if (typeof tip === 'string') {
    return (
      <div
        className={`${styles.tipWithString} ${className || ''}`}
        data-tooltip={tip}
        data-placement={placement}
        data-placement-center={center}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      className={`${styles.tipWithNode} ${className || ''}`}
      data-placement={placement}
      data-placement-center={center}
    >
      <div className={styles.tip}>{tip}</div>
      {children}
    </div>
  )
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
