import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CompensationProgressBar from 'components/CompensationProgressBar'
import Button from 'widgets/Button'
import { IMMATURE_EPOCHS } from 'utils/const'
import { shannonToCKBFormatter, uniformTimeFormatter } from 'utils/formatters'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'
import { epochParser } from 'utils/parsers'
import CompensationPeriodTooltip from 'components/CompensationPeriodTooltip'

import styles from './daoRecordRow.module.scss'
import hooks from './hooks'

const EPOCHS_PER_DAY = 6

enum Status {
  Depositing,
  FourEpochsSinceDeposit,
  Deposited,
  Withdrawing,
  Locked,
  Unlockable,
  Unlocking,
  Completed,
}

const getDaysAndHours = (seconds: number) => {
  const SECS_PER_HOUR = 3600 * 1000
  const SECS_PER_DAY = 24 * SECS_PER_HOUR

  const days = Math.floor(seconds / SECS_PER_DAY)
  const hours = Math.floor((seconds - days * SECS_PER_DAY) / SECS_PER_HOUR)
  return { days, hours }
}

export interface DAORecordProps extends State.NervosDAORecord {
  depositEpoch: string // deposit epoch string
  currentEpoch: string // current epoch string
  withdrawCapacity: string | null // capacity that is available for withdraw
  connectionStatus: 'online' | 'offline' // connection status
  onClick: React.EventHandler<React.MouseEvent> // on action button click
  onToggle: () => void
  pending?: boolean
  isCollapsed?: boolean
  tipBlockTimestamp: number // tip block timestamp, used to calculate apc
  genesisBlockTimestamp: number | undefined // genesis block timestamp, used to calculate apc
  unlockTimestamp?: string
  depositTxHash?: string
  withdrawTxHash?: string
  unlockTxHash?: string
}

export const DAORecord = ({
  blockNumber,
  tipBlockTimestamp,
  capacity,
  outPoint: { txHash, index },
  timestamp,
  genesisBlockTimestamp,
  depositTimestamp,
  depositOutPoint,
  depositEpoch,
  currentEpoch,
  withdrawCapacity,
  connectionStatus,
  onClick,
  pending = false,
  isCollapsed = true,
  onToggle,
  unlockTimestamp,
  depositTxHash,
  withdrawTxHash,
  unlockTxHash,
}: DAORecordProps) => {
  const [t] = useTranslation()
  const [withdrawEpoch, setWithdrawEpoch] = useState('')
  const [withdrawTimestamp, setWithdrawTimestamp] = useState('')
  const [apc, setApc] = useState(0)
  const isWithdrawn = !!depositOutPoint

  // update apc
  hooks.useUpdateApc({
    depositTimestamp: +(depositTimestamp || 0),
    genesisBlockTimestamp: +(genesisBlockTimestamp || 0),
    tipBlockTimestamp,
    timestamp: +(timestamp || 0),
    setApc,
  })

  hooks.useUpdateWithdrawEpochs({ isWithdrawn, blockNumber, setWithdrawEpoch, setWithdrawTimestamp })
  const onTxRecordClick = hooks.useOnTxRecordClick()

  const currentEpochValue = epochParser(currentEpoch).value
  const depositEpochInfo = epochParser(depositEpoch)
  const depositEpochValue = depositEpochInfo.value
  const withdrawEpochValue = withdrawEpoch ? epochParser(withdrawEpoch).value : undefined
  const compensationEndEpochValue = calculateClaimEpochValue(
    epochParser(depositEpoch),
    epochParser(withdrawEpoch || currentEpoch)
  )

  const leftEpochs = compensationEndEpochValue - currentEpochValue
  const leftDays = Math.round(leftEpochs / EPOCHS_PER_DAY)

  const compensation = BigInt(withdrawCapacity || capacity) - BigInt(capacity)
  const lockedPeriod = unlockTimestamp && depositTimestamp ? +unlockTimestamp - +depositTimestamp : ''
  const compensatedPeriod = withdrawTimestamp && depositTimestamp ? +withdrawTimestamp - +depositTimestamp : ''

  let status: Status = Status.Deposited
  let message = ''
  if (lockedPeriod) {
    status = Status.Completed
  } else if (!(blockNumber || depositOutPoint)) {
    // the cell is not deposited yet and the status is depositing
    status = Status.Depositing
    message = t('nervos-dao.compensation-period.stage-messages.pending')
  } else if (!withdrawEpoch) {
    // it's depostied
    if (currentEpochValue < depositEpochValue + IMMATURE_EPOCHS) {
      status = Status.FourEpochsSinceDeposit
      message = t('nervos-dao.compensation-period.stage-messages.immature-for-withdraw')
    } else if (pending) {
      status = Status.Withdrawing
      message = t('nervos-dao.compensation-period.stage-messages.withdrawing')
    } else {
      message = t('nervos-dao.compensation-period.stage-messages.next-compensation-cycle', { days: leftDays })
    }
  }
  // the cell is withdrawn and the status should be one of locked, unlockable, unlocking
  else if (pending) {
    status = Status.Unlocking
    message = t('nervos-dao.compensation-period.stage-messages.unlocking')
  } else {
    const withdrawEpochInfo = epochParser(withdrawEpoch)
    const unlockEpochValue = calculateClaimEpochValue(depositEpochInfo, withdrawEpochInfo) + IMMATURE_EPOCHS
    if (unlockEpochValue <= currentEpochValue) {
      status = Status.Unlockable
      message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-has-ended')
    } else {
      status = Status.Locked
      message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-will-end', { days: leftDays })
    }
  }

  const isActionAvailable = connectionStatus === 'online' && [Status.Deposited, Status.Unlockable].includes(status)

  const progressOrPeriod =
    status === Status.Completed ? (
      <>
        {lockedPeriod ? (
          <div className={styles.lockedPeriod}>
            <span>{`${t('nervos-dao.deposit-record.locked-period')}:`}</span>
            <span>{t('nervos-dao.deposit-record.days-hours', getDaysAndHours(lockedPeriod))}</span>
          </div>
        ) : null}
        {compensatedPeriod ? (
          <div className={styles.compensatedPeriod}>
            <span>{`${t('nervos-dao.deposit-record.compensated-period')}:`}</span>
            <span>{t('nervos-dao.deposit-record.days-hours', getDaysAndHours(compensatedPeriod))}</span>
          </div>
        ) : null}
      </>
    ) : (
      <>
        <div className={styles.stage}>
          <CompensationProgressBar
            currentEpochValue={currentEpochValue}
            endEpochValue={compensationEndEpochValue}
            withdrawEpochValue={withdrawEpochValue}
          />
          <div className={styles.tooltip}>
            <CompensationPeriodTooltip
              depositEpochValue={depositEpochValue}
              baseEpochTimestamp={withdrawEpochValue ? +withdrawTimestamp : tipBlockTimestamp}
              baseEpochValue={withdrawEpochValue || currentEpochValue}
              endEpochValue={compensationEndEpochValue}
              isWithdrawn={!!withdrawEpochValue}
            />
          </div>
          <span className={styles.message}>{message}</span>
        </div>

        <div className={styles.action}>
          <Button
            type="primary"
            data-tx-hash={txHash}
            data-index={index}
            onClick={onClick}
            disabled={!isActionAvailable}
            label={t(`nervos-dao.deposit-record.${depositOutPoint ? 'unlock' : 'withdraw'}-action-label`)}
          />
        </div>
      </>
    )

  return (
    <div className={styles.container} data-is-collapsed={isCollapsed}>
      <div className={styles.badge}>
        <div>
          <span>{t('nervos-dao.deposit-record.deposited-at')}</span>
          <time>{uniformTimeFormatter(+timestamp)}</time>
        </div>
      </div>

      <div className={styles.collapse}>
        <button type="button" onClick={onToggle}>
          <span className={styles.collapseIcon} />
        </button>
      </div>

      <div className={styles.compensation}>
        <span>
          {compensation >= BigInt(0)
            ? `${depositOutPoint ? '' : '+'}${shannonToCKBFormatter(compensation.toString()).toString()} CKB`
            : ''}
        </span>
      </div>

      <div className={styles.amount}>
        <span>{`${shannonToCKBFormatter(capacity)} CKB`}</span>
      </div>
      {progressOrPeriod}

      <div className={styles.apc}>
        <span>{`APC: ~${apc}%`}</span>
      </div>

      <div className={styles.transactions}>
        <div className={styles.title}>{t('nervos-dao.deposit-record.record')}</div>
        {depositTimestamp ? (
          <button
            type="button"
            className={styles.deposited}
            data-tx-hash={depositTxHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.deposited')}</span>
            <span>{uniformTimeFormatter(+depositTimestamp)}</span>
          </button>
        ) : null}
        {withdrawTimestamp ? (
          <button
            type="button"
            className={styles.withdrawn}
            data-tx-hash={withdrawTxHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.withdrawn')}</span>
            <span>{uniformTimeFormatter(+withdrawTimestamp)}</span>
          </button>
        ) : null}
        {unlockTimestamp ? (
          <button
            type="button"
            className={styles.unlocked}
            data-tx-hash={unlockTxHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.unlocked')}</span>
            <span>{uniformTimeFormatter(+unlockTimestamp)}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
