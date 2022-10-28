import React from 'react'
import styles from './tooltip.module.scss'

export type Placement = 'top' | 'right' | 'left' | 'bottom'

const Tooltip: React.FC<{ tip: string; className?: string; placement?: Placement }> = ({
  children,
  tip,
  className,
  placement,
}) => {
  return (
    <div className={`${styles.tipContainer} ${className || ''}`} data-tooltip={tip} data-placement={placement}>
      {children}
    </div>
  )
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
