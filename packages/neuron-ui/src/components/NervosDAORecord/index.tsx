import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CompensationProgressBar from 'components/CompensationProgressBar'
import Button from 'widgets/Button'
import {
  calculateClaimEpochValue,
  ConnectionStatus,
  CONSTANTS,
  shannonToCKBFormatter,
  uniformTimeFormatter,
  getDAOCellStatus,
  CellStatus,
  epochParser,
} from 'utils'
import CompensationPeriodTooltip from 'components/CompensationPeriodTooltip'

import styles from './daoRecordRow.module.scss'
import hooks from './hooks'

const { IMMATURE_EPOCHS, HOURS_PER_EPOCH } = CONSTANTS

const EPOCHS_PER_DAY = 6

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
  connectionStatus: 'online' | 'offline' | 'connecting' // connection status
  onClick: React.EventHandler<React.MouseEvent> // on action button click
  onToggle: () => void
  isCollapsed?: boolean
  tipBlockTimestamp: number // tip block timestamp, used to calculate apc
  genesisBlockTimestamp: number | undefined // genesis block timestamp, used to calculate apc
}

export const DAORecord = ({
  blockNumber,
  tipBlockTimestamp,
  capacity,
  outPoint: { txHash, index },
  timestamp,
  genesisBlockTimestamp,
  depositEpoch,
  currentEpoch,
  withdrawCapacity,
  connectionStatus,
  onClick,
  status,
  isCollapsed = true,
  onToggle,
  depositInfo,
  withdrawInfo,
  unlockInfo,
}: DAORecordProps) => {
  const [t] = useTranslation()
  const [withdrawEpoch, setWithdrawEpoch] = useState('')
  const [withdrawTimestamp, setWithdrawTimestamp] = useState('')
  const [apc, setApc] = useState(0)
  const isWithdrawn = !!withdrawInfo
  // update apc
  hooks.useUpdateApc({
    depositTimestamp: +(depositInfo?.timestamp || 0),
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

  const leftEpochs = Math.max(compensationEndEpochValue - currentEpochValue, 0)
  const leftDays = (Math.round(leftEpochs / EPOCHS_PER_DAY) ?? '').toString()

  const compensation = BigInt(withdrawCapacity || capacity) - BigInt(capacity)

  const cellStatus: CellStatus = getDAOCellStatus({
    unlockInfo,
    withdrawInfo,
    status,
    withdrawEpoch,
    depositEpoch,
    currentEpoch,
  })

  let message = ''

  if (ConnectionStatus.Online === connectionStatus) {
    switch (cellStatus) {
      case CellStatus.Unlocking: {
        message = t('nervos-dao.compensation-period.stage-messages.unlocking')
        break
      }
      case CellStatus.Withdrawing: {
        message = t('nervos-dao.compensation-period.stage-messages.withdrawing')
        break
      }
      case CellStatus.Unlockable: {
        message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-has-ended')
        break
      }
      case CellStatus.Depositing: {
        message = t('nervos-dao.compensation-period.stage-messages.pending')
        break
      }
      case CellStatus.ImmatureForWithdraw: {
        let hours: string | number = (depositEpochValue + IMMATURE_EPOCHS - currentEpochValue) * HOURS_PER_EPOCH
        if (Number.isNaN(hours) || hours < 0 || hours > HOURS_PER_EPOCH * IMMATURE_EPOCHS) {
          hours = '--'
        } else {
          hours = hours.toFixed(1)
        }
        message = t('nervos-dao.compensation-period.stage-messages.immature-for-withdraw', { hours })
        break
      }
      case CellStatus.Deposited: {
        message = t('nervos-dao.compensation-period.stage-messages.next-compensation-cycle', { days: leftDays || '--' })
        break
      }
      case CellStatus.ImmatureForUnlock: {
        let hours: number | string = (compensationEndEpochValue + IMMATURE_EPOCHS - currentEpochValue) * HOURS_PER_EPOCH
        if (Number.isNaN(hours) || hours < 0 || hours > HOURS_PER_EPOCH * IMMATURE_EPOCHS) {
          hours = '--'
        } else {
          hours = hours.toFixed(1)
        }
        message = t('nervos-dao.compensation-period.stage-messages.immature-for-unlock', { hours })
        break
      }
      case CellStatus.Locked: {
        message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-will-end', {
          days: leftDays || '--',
        })
        break
      }
      default: {
        // ignore
      }
    }
  }

  const lockedPeriod =
    unlockInfo?.timestamp && depositInfo?.timestamp ? +unlockInfo?.timestamp - +depositInfo?.timestamp : undefined
  const compensatedPeriod =
    withdrawInfo?.timestamp && depositInfo?.timestamp ? +withdrawInfo?.timestamp - +depositInfo?.timestamp : undefined

  const isActionAvailable =
    connectionStatus === 'online' && [CellStatus.Deposited, CellStatus.Unlockable].includes(cellStatus)

  const progressOrPeriod =
    CellStatus.Completed === cellStatus ? (
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
            pending={[CellStatus.Depositing, CellStatus.ImmatureForWithdraw].includes(cellStatus)}
            currentEpochValue={currentEpochValue}
            endEpochValue={compensationEndEpochValue}
            withdrawEpochValue={withdrawEpochValue}
          />
          <div className={styles.tooltip}>
            {CellStatus.Depositing === cellStatus ? null : (
              <CompensationPeriodTooltip
                depositEpochValue={depositEpochValue}
                baseEpochTimestamp={withdrawEpochValue ? +withdrawTimestamp : tipBlockTimestamp}
                baseEpochValue={withdrawEpochValue || currentEpochValue}
                endEpochValue={compensationEndEpochValue}
                isWithdrawn={!!withdrawEpochValue}
              />
            )}
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
            label={t(`nervos-dao.deposit-record.${isWithdrawn ? 'unlock' : 'withdraw'}-action-label`)}
          />
        </div>
      </>
    )

  let badge = (
    <div>
      <span>{t('nervos-dao.deposit-record.deposited-at')}</span>
      <time>{depositInfo ? uniformTimeFormatter(+depositInfo.timestamp) : ''}</time>
    </div>
  )

  if (CellStatus.Completed === cellStatus) {
    badge = (
      <div>
        <span>{t('nervos-dao.deposit-record.completed-at')}</span>
        <time>{unlockInfo ? uniformTimeFormatter(+unlockInfo.timestamp) : ''}</time>
      </div>
    )
  } else if (CellStatus.Depositing === cellStatus) {
    badge = (
      <div>
        <span>{t('nervos-dao.deposit-record.deposit-pending')}</span>
      </div>
    )
  }

  return (
    <div className={styles.container} data-is-collapsed={isCollapsed}>
      <div className={styles.badge}>{badge}</div>

      <div className={styles.collapse}>
        <button type="button" onClick={onToggle}>
          <span className={styles.collapseIcon} />
        </button>
      </div>

      <div className={styles.compensation}>
        <span>
          {CellStatus.Depositing !== cellStatus && compensation >= BigInt(0)
            ? `+${shannonToCKBFormatter(compensation.toString()).toString()} CKB`
            : '- CKB'}
        </span>
      </div>

      <div className={styles.amount}>
        <span>{`${shannonToCKBFormatter(capacity)} CKB`}</span>
      </div>
      {progressOrPeriod}

      <div className={styles.apc}>
        <span>{apc ? `APC: ~${apc}%` : `APC: - %`}</span>
      </div>

      <div className={styles.transactions}>
        <div className={styles.title}>{t('nervos-dao.deposit-record.record')}</div>
        {depositInfo ? (
          <button
            type="button"
            className={styles.deposited}
            data-tx-hash={depositInfo.txHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.deposited')}</span>
            <span>{uniformTimeFormatter(+depositInfo.timestamp)}</span>
          </button>
        ) : null}
        {withdrawInfo ? (
          <button
            type="button"
            className={styles.withdrawn}
            data-tx-hash={withdrawInfo.txHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.withdrawn')}</span>
            <span>{uniformTimeFormatter(+withdrawInfo.timestamp)}</span>
          </button>
        ) : null}
        {unlockInfo ? (
          <button
            type="button"
            className={styles.unlocked}
            data-tx-hash={unlockInfo.txHash}
            data-text={t('nervos-dao.deposit-record.tx-record')}
            onClick={onTxRecordClick}
          >
            <span>{t('nervos-dao.deposit-record.unlocked')}</span>
            <span>{uniformTimeFormatter(+unlockInfo.timestamp)}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
