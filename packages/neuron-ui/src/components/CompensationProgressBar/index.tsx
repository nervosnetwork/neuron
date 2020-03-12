import React from 'react'
import { WITHDRAW_EPOCHS } from 'utils/const'
import styles from './compensationProgressBar.module.scss'

export interface CompensationProgressBarProps {
  style?: object
  endEpochValue: number
  currentEpochValue: number
  withdrawEpochValue?: number
}

const CompensationProgressBar = ({
  endEpochValue,
  currentEpochValue,
  withdrawEpochValue,
  style,
}: CompensationProgressBarProps) => {
  const isWithdrawn = withdrawEpochValue !== undefined

  const currentCursor = isWithdrawn
    ? Math.min(currentEpochValue, endEpochValue)
    : 180 + currentEpochValue - endEpochValue

  const withdrawCursor = withdrawEpochValue || currentCursor

  return (
    <div className={styles.container} style={style}>
      <div className={styles.indicator} style={{ left: `calc(${(100 * currentCursor) / WITHDRAW_EPOCHS}% - 5px)` }} />
      <progress
        className={styles.progress}
        max={WITHDRAW_EPOCHS}
        value={withdrawCursor}
        data-is-withdrawn={isWithdrawn}
      />
    </div>
  )
}

CompensationProgressBar.displayName = 'CompensationProgressBar'

export default CompensationProgressBar
