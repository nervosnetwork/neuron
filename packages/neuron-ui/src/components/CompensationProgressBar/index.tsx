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

  let currentCursor = isWithdrawn
    ? Math.min(currentEpochValue, endEpochValue)
    : WITHDRAW_EPOCHS + currentEpochValue - endEpochValue

  if (currentCursor > WITHDRAW_EPOCHS) {
    currentCursor = WITHDRAW_EPOCHS
  } else if (currentCursor < 0) {
    currentCursor = 0
  }

  const withdrawCursor = withdrawEpochValue ? WITHDRAW_EPOCHS + withdrawEpochValue - endEpochValue : currentCursor

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
