import React from 'react'
import { useTranslation } from 'react-i18next'
import getCompensationPeriod from 'utils/getCompensationPeriod'
import getCompensatedTime from 'utils/getCompensatedTime'
import { WITHDRAW_EPOCHS, CompensationPeriod } from 'utils/const'
import { uniformTimeFormatter } from 'utils/formatters'
import styles from './compensationPeriodTooltip.module.scss'

const HOUR = 3_600_000
const HOURS_PER_EPOCH = 4 * HOUR
const SECS_PER_DAY = 24 * HOUR

const formatTime = (timestamp: number) => {
  return uniformTimeFormatter(timestamp).split(' ')[0]
}

export interface CompensationPeriodTooltipProps {
  depositEpochValue: number
  baseEpochTimestamp: number
  baseEpochValue: number // current epoch if it's not been withdrawn, or the withdraw epoch
  endEpochValue: number
  isWithdrawn?: boolean
}

const CompensationPeriodTooltip = ({
  depositEpochValue,
  baseEpochTimestamp,
  baseEpochValue,
  endEpochValue,
  isWithdrawn = false,
}: CompensationPeriodTooltipProps) => {
  const [t] = useTranslation()
  const {
    leftTime: { totalHours },
  } = getCompensationPeriod({ currentEpochValue: baseEpochValue, endEpochValue })
  const endEpochTimestamp = totalHours * HOUR + baseEpochTimestamp
  // TODO: the time in the design is ambiguous, more discussion needed
  const suggestStartEpochTimestamp =
    endEpochTimestamp - (1 - CompensationPeriod.SUGGEST_START) * WITHDRAW_EPOCHS * HOURS_PER_EPOCH
  const endingStartEpochTimestamp =
    endEpochTimestamp - (1 - CompensationPeriod.REQUEST_START) * WITHDRAW_EPOCHS * HOURS_PER_EPOCH
  let stage = 'normal'
  if (baseEpochTimestamp > endingStartEpochTimestamp) {
    stage = 'ending'
  } else if (baseEpochTimestamp > suggestStartEpochTimestamp) {
    stage = 'suggested'
  }
  const { days, hours } = getCompensatedTime({ currentEpochValue: baseEpochValue, depositEpochValue })

  if (isWithdrawn) {
    return (
      <div className={styles.container} data-stage={stage}>
        <div className={styles.compensated}>
          <span>{t('nervos-dao.compensation-period.tooltip.compensated-period')}</span>
          <span>{t('nervos-dao.compensation-period.tooltip.days-hours', { days, hours })}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.times}>
          <div className={styles[stage]}>
            <div className={styles.time}>{uniformTimeFormatter(baseEpochTimestamp)}</div>
            <div style={{ fontWeight: 900 }}>{t('nervos-dao.compensation-period.tooltip.withdrawn')}</div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={styles.container} data-stage={stage}>
      <div className={styles.compensated}>
        <span>{t('nervos-dao.compensation-period.tooltip.compensated-period')}</span>
        <span>{t('nervos-dao.compensation-period.tooltip.days-hours', { days, hours })}</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.times}>
        <div className={styles.normal}>{t('nervos-dao.compensation-period.tooltip.normal')}</div>
        <div className={styles.suggested}>
          <div className={styles.time}>
            {`${formatTime(suggestStartEpochTimestamp)} ~ ${formatTime(endingStartEpochTimestamp - SECS_PER_DAY)}`}
          </div>
          <div>{t('nervos-dao.compensation-period.tooltip.suggested')}</div>
        </div>
        <div className={styles.ending}>
          <div className={styles.time}>
            {`${formatTime(endingStartEpochTimestamp)} ~ ${formatTime(endEpochTimestamp)}`}
          </div>
          <div>{t('nervos-dao.compensation-period.tooltip.ending')}</div>
        </div>
      </div>
    </div>
  )
}

CompensationPeriodTooltip.displayName = 'CompensationPeriodTooltip'
export default CompensationPeriodTooltip
