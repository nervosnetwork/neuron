import React from 'react'
import { useTranslation } from 'react-i18next'
import { getCompensatedTime, getCompensationPeriod, CONSTANTS, CompensationPeriod, uniformTimeFormatter } from 'utils'
import styles from './compensationPeriodTooltip.module.scss'

const { WITHDRAW_EPOCHS, IMMATURE_EPOCHS } = CONSTANTS

const HOUR = 3_600_000
const HOURS_PER_EPOCH = 4 * HOUR
const SECS_PER_DAY = 24 * HOUR

const formatTime = (timestamp: number) => {
  try {
    return uniformTimeFormatter(timestamp).split(' ')[0]
  } catch (err) {
    console.warn(err)
    return '-'
  }
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
  if (baseEpochValue < depositEpochValue || baseEpochValue > endEpochValue) {
    return null
  }
  const {
    leftTime: { totalHours },
  } = getCompensationPeriod({ currentEpochValue: baseEpochValue, endEpochValue })
  const endEpochTimestamp = totalHours * HOUR + baseEpochTimestamp
  const suggestStartEpochTimestamp =
    endEpochTimestamp - (1 - CompensationPeriod.SUGGEST_START) * WITHDRAW_EPOCHS * HOURS_PER_EPOCH
  const endingStartEpochTimestamp =
    endEpochTimestamp - (1 - CompensationPeriod.REQUEST_START) * WITHDRAW_EPOCHS * HOURS_PER_EPOCH

  const { days, hours } = getCompensatedTime({ currentEpochValue: baseEpochValue, depositEpochValue })
  const isImmature = baseEpochValue < depositEpochValue + IMMATURE_EPOCHS

  if (isImmature) {
    return (
      <div className={styles.container}>
        <div className={styles.compensated}>
          <span>{t('nervos-dao.compensation-period.tooltip.compensated-period')}</span>
          <span>{t('nervos-dao.compensation-period.tooltip.days-hours', { days, hours })}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.times}>
          <div className={styles.immature}>{t('nervos-dao.compensation-period.tooltip.immature-for-withdraw')}</div>
        </div>
      </div>
    )
  }

  let stage = 'normal'
  if (baseEpochTimestamp > endingStartEpochTimestamp) {
    stage = 'ending'
  } else if (baseEpochTimestamp > suggestStartEpochTimestamp) {
    stage = 'suggested'
  }

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
          {suggestStartEpochTimestamp && endingStartEpochTimestamp ? (
            <div className={styles.time}>
              {`${formatTime(suggestStartEpochTimestamp)} ~ ${formatTime(endingStartEpochTimestamp - SECS_PER_DAY)}`}
            </div>
          ) : null}
          <div>{t('nervos-dao.compensation-period.tooltip.suggested')}</div>
        </div>
        <div className={styles.ending}>
          {endingStartEpochTimestamp && endEpochTimestamp ? (
            <div className={styles.time}>
              {`${formatTime(endingStartEpochTimestamp)} ~ ${formatTime(endEpochTimestamp)}`}
            </div>
          ) : null}
          <div>{t('nervos-dao.compensation-period.tooltip.ending')}</div>
        </div>
      </div>
    </div>
  )
}

CompensationPeriodTooltip.displayName = 'CompensationPeriodTooltip'
export default CompensationPeriodTooltip
