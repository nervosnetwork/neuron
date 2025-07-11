import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CompensationProgressBar from 'components/CompensationProgressBar'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import {
  calculateClaimEpochValue,
  ConnectionStatus,
  shannonToCKBFormatter,
  uniformTimeFormatter,
  getDAOCellStatus,
  CellStatus,
  epochParser,
  clsx,
  RoutePath,
  getExplorerUrl,
} from 'utils'
import CompensationPeriodTooltip from 'components/CompensationPeriodTooltip'
import { Clock } from 'widgets/Icons/icon'
import { Link } from 'react-router-dom'
import { HIDE_BALANCE } from 'utils/const'
import Spinner from 'widgets/Spinner'
import Tooltip from 'widgets/Tooltip'
import { openExternal } from 'services/remote'
import styles from './daoRecordRow.module.scss'
import hooks from './hooks'

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
  connectionStatus: State.ConnectionStatus // connection status
  onClick: React.EventHandler<React.MouseEvent> // on action button click
  tipBlockTimestamp: number // tip block timestamp, used to calculate apc, dovetails with current epoch
  genesisBlockTimestamp: number | undefined // genesis block timestamp, used to calculate apc
  isPrivacyMode?: boolean
  hasCkbBalance?: boolean
  showDetailInExplorer?: boolean
  isMainnet?: boolean
}

export const DAORecord = ({
  blockHash,
  tipBlockTimestamp,
  capacity,
  depositOutPoint,
  outPoint: { txHash, index },
  timestamp,
  genesisBlockTimestamp,
  depositEpoch,
  currentEpoch,
  withdrawCapacity,
  connectionStatus,
  onClick,
  status,
  depositInfo,
  withdrawInfo,
  unlockInfo,
  isPrivacyMode,
  hasCkbBalance,
  showDetailInExplorer,
  isMainnet,
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

  hooks.useUpdateWithdrawEpochs({ isWithdrawn, blockHash, setWithdrawEpoch, setWithdrawTimestamp })

  const currentEpochValue = epochParser(currentEpoch).value
  const depositEpochInfo = epochParser(depositEpoch)
  const depositEpochValue = depositEpochInfo.value
  const withdrawEpochValue = withdrawEpoch ? epochParser(withdrawEpoch).value : undefined
  const compensationEndEpochValue = calculateClaimEpochValue(
    epochParser(depositEpoch),
    epochParser(withdrawEpoch || currentEpoch)
  )

  const leftEpochs = Math.max(compensationEndEpochValue - currentEpochValue, 0)

  let leftHours = ''
  let leftDays = ''
  if (leftEpochs < EPOCHS_PER_DAY) {
    leftHours = (parseInt(`${leftEpochs * (24 / EPOCHS_PER_DAY)}`, 10) || 1).toString()
  } else {
    leftDays = (Math.round(leftEpochs / EPOCHS_PER_DAY) ?? '').toString()
  }

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
  let showLoading = false

  if (ConnectionStatus.Online === connectionStatus) {
    switch (cellStatus) {
      case CellStatus.Unlocking: {
        message = t('nervos-dao.compensation-period.stage-messages.unlocking')
        showLoading = true
        break
      }
      case CellStatus.Withdrawing: {
        message = t('nervos-dao.compensation-period.stage-messages.withdrawing')
        showLoading = true
        break
      }
      case CellStatus.Unlockable: {
        message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-has-ended')
        break
      }
      case CellStatus.Depositing: {
        message = t('nervos-dao.compensation-period.stage-messages.deposit-in-progress')
        showLoading = true
        break
      }
      case CellStatus.Deposited: {
        if (!compensationEndEpochValue) {
          message = t('nervos-dao.compensation-period.stage-messages.calculating-the-compensation-cycle')
        } else if (leftHours) {
          message = t('nervos-dao.compensation-period.stage-messages.next-compensation-cycle-hours', {
            hours: leftHours || '--',
          })
        } else {
          message = t('nervos-dao.compensation-period.stage-messages.next-compensation-cycle', {
            days: leftDays || '--',
          })
        }
        break
      }
      case CellStatus.Locked: {
        if (!compensationEndEpochValue) {
          message = t('nervos-dao.compensation-period.stage-messages.calculating-the-compensation-cycle')
        } else if (leftHours) {
          message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-will-end-hours', {
            hours: leftHours || '--',
          })
        } else {
          message = t('nervos-dao.compensation-period.stage-messages.compensation-cycle-will-end', {
            days: leftDays || '--',
          })
        }
        break
      }
      default: {
        // ignore
      }
    }
  }

  const lockedPeriod =
    unlockInfo?.timestamp && depositInfo?.timestamp ? +unlockInfo.timestamp - +depositInfo.timestamp : undefined
  const compensatedPeriod =
    withdrawInfo?.timestamp && depositInfo?.timestamp ? +withdrawInfo.timestamp - +depositInfo.timestamp : undefined

  const isWithdrawnDisabled = CellStatus.Deposited === cellStatus && !hasCkbBalance
  const isActionAvailable =
    connectionStatus === 'online' &&
    [CellStatus.Deposited, CellStatus.Unlockable, CellStatus.Depositing].includes(cellStatus) &&
    !isWithdrawnDisabled

  const depositOutPointKey = depositOutPoint
    ? `${depositOutPoint.txHash}-${depositOutPoint.index}`
    : `${txHash}-${index}`
  const badgePopover = depositOutPointKey && (
    <div className={styles.popover}>
      <div className={styles.content}>
        <div className={styles.fields}>
          {depositInfo && (
            <>
              <span>{t('nervos-dao.deposit-record.deposited')}</span>
              <span>{uniformTimeFormatter(+depositInfo.timestamp)}</span>
            </>
          )}
          {withdrawInfo && (
            <>
              <span>{t('nervos-dao.deposit-record.withdrawn')}</span>
              <span>{uniformTimeFormatter(+withdrawInfo.timestamp)}</span>
            </>
          )}
          {unlockInfo && (
            <>
              <span>{t('nervos-dao.deposit-record.unlocked')}</span>
              <span>{uniformTimeFormatter(+unlockInfo.timestamp)}</span>
            </>
          )}
        </div>
        {showDetailInExplorer ? (
          <Button
            className={styles.txRecordBtn}
            onClick={() => {
              openExternal(`${getExplorerUrl(isMainnet)}/transaction/${txHash}`)
            }}
            type="default"
            label={t('nervos-dao.deposit-record.view-tx-detail')}
          />
        ) : (
          <Link className={styles.send} to={`${RoutePath.NervosDAO}/${depositOutPointKey}`}>
            <Button
              className={styles.txRecordBtn}
              type="default"
              label={t('nervos-dao.deposit-record.view-tx-detail')}
            />
          </Link>
        )}
      </div>
    </div>
  )

  let badge = (
    <div className={styles.badge}>
      <span>{t('nervos-dao.deposit-record.deposited-at')}</span>
      <time>{depositInfo ? uniformTimeFormatter(+depositInfo.timestamp) : ''}</time>
      <Clock />
      {badgePopover}
    </div>
  )

  if (CellStatus.Completed === cellStatus) {
    badge = (
      <div className={styles.badge}>
        <span>{t('nervos-dao.deposit-record.completed-at')}</span>
        <time>{unlockInfo ? uniformTimeFormatter(+unlockInfo.timestamp) : ''}</time>
        <Clock />
        {badgePopover}
      </div>
    )
  } else if (CellStatus.Depositing === cellStatus) {
    badge = (
      <div className={styles.badge}>
        <span>{t('nervos-dao.deposit-record.deposit-pending')}</span>
        {badgePopover}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.amountAndBadge}>
        {isPrivacyMode ? (
          <span className={styles.amount}>{`${HIDE_BALANCE} CKB`}</span>
        ) : (
          <CopyZone
            className={clsx(styles.amount, styles.withCopy)}
            content={shannonToCKBFormatter(capacity, false, false)}
          >
            {`${shannonToCKBFormatter(capacity)} CKB`}
          </CopyZone>
        )}
        {badge}
      </div>

      <div className={styles.compensationAndAPC}>
        <span className={styles.compensation}>
          {CellStatus.Depositing !== cellStatus && compensation >= BigInt(0)
            ? `${isPrivacyMode ? HIDE_BALANCE : `+${shannonToCKBFormatter(compensation.toString()).toString()}`} CKB`
            : '- CKB'}
        </span>
        <span className={styles.apc}>{apc ? `APC ≈ ${isPrivacyMode ? HIDE_BALANCE : `${apc}%`}` : `APC ≈ - %`}</span>
      </div>

      {CellStatus.Completed === cellStatus ? (
        <div className={styles.infoTags}>
          {lockedPeriod ? (
            <div className={clsx(styles.infoTag, styles.lockedPeriod)}>
              <span className={styles.pin} />
              <span className={styles.name}>{`${t('nervos-dao.deposit-record.locked-period')}`}</span>
              <span className={styles.value}>
                {t('nervos-dao.deposit-record.days-hours', getDaysAndHours(lockedPeriod))}
              </span>
            </div>
          ) : null}
          {compensatedPeriod ? (
            <div className={clsx(styles.infoTag, styles.compensatedPeriod)}>
              <span className={styles.pin} />
              <span className={styles.name}>{`${t('nervos-dao.deposit-record.compensated-period')}`}</span>
              <span className={styles.value}>
                {t('nervos-dao.deposit-record.days-hours', getDaysAndHours(compensatedPeriod))}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.stageAndAction}>
          <div className={styles.stage}>
            <CompensationProgressBar
              pending={CellStatus.Depositing === cellStatus}
              currentEpochValue={currentEpochValue}
              endEpochValue={compensationEndEpochValue}
              withdrawEpochValue={withdrawEpochValue}
              style={{ width: 348 }}
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
            {showLoading ? (
              <p className={styles.depositingMsg}>
                {message}
                <Spinner className={styles.spinner} />
              </p>
            ) : (
              <span className={styles.message}>{message}</span>
            )}
          </div>

          <div className={styles.action}>
            {cellStatus === CellStatus.Locked ? (
              <div className={styles.lockWarn}>{t('nervos-dao.deposit-record.lock-warn')}</div>
            ) : null}
            {isWithdrawnDisabled ? (
              <Tooltip
                tip={<div>{t('nervos-dao.deposit-record.insufficient-balance-to-unlock')}</div>}
                placement="top"
                tipClassName={styles.tip}
              >
                <Button
                  type="primary"
                  data-tx-hash={txHash}
                  data-index={index}
                  onClick={onClick}
                  disabled={!isActionAvailable}
                  label={t(`nervos-dao.deposit-record.${isWithdrawn ? 'unlock' : 'withdraw'}-action-label`)}
                />
              </Tooltip>
            ) : (
              <Button
                type="primary"
                data-tx-hash={txHash}
                data-index={index}
                onClick={onClick}
                disabled={!isActionAvailable}
                label={
                  cellStatus === CellStatus.Depositing
                    ? t('nervos-dao.deposit-record.view-tx-detail')
                    : t(`nervos-dao.deposit-record.${isWithdrawn ? 'unlock' : 'withdraw'}-action-label`)
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
