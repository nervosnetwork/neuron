import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { ReactComponent as EpochBtn } from 'widgets/Icons/EpochBtn.svg'
import { WITHDRAW_EPOCHS, IMMATURE_EPOCHS } from 'utils/const'
import { shannonToCKBFormatter, uniformTimeFormatter, localNumberFormatter } from 'utils/formatters'
import calculateClaimEpochValue from 'utils/calculateClaimEpochValue'
import { epochParser } from 'utils/parsers'

import styles from './daoRecordRow.module.scss'
import hooks from './hooks'

export interface DAORecordProps extends State.NervosDAORecord {
  tipBlockNumber: string // tip block number
  depositEpoch: string // deposit epoch string
  currentEpoch: string // current epoch string
  compensationPeriod: {
    targetEpochValue: number // target epoch value in this compensation period
  } | null
  withdrawCapacity: string | null // capacity that is available for withdraw
  tipBlockTimestamp: number // tip block timestamp, used to calculate apc
  genesisBlockTimestamp: number | undefined // genesis block timestamp, used to calculate apc
  connectionStatus: 'online' | 'offline' // connection status
  onClick: React.EventHandler<React.MouseEvent> // on action button click
  onCompensationPeriodExplanationClick: React.EventHandler<any> // on compensation dialog trigger click
}

export const DAORecord = ({
  blockHash,
  blockNumber,
  tipBlockNumber,
  tipBlockTimestamp,
  capacity,
  outPoint: { txHash, index },
  timestamp,
  genesisBlockTimestamp,
  depositTimestamp,
  depositOutPoint,
  depositEpoch,
  currentEpoch,
  compensationPeriod,
  withdrawCapacity,
  connectionStatus,
  onClick,
  onCompensationPeriodExplanationClick,
}: DAORecordProps) => {
  const [t] = useTranslation()
  const [withdrawingEpoch, setWithdrawingEpoch] = useState('')
  const [apc, setApc] = useState(0)

  // update apc
  hooks.useUpdateApc({
    depositTimestamp: +(depositTimestamp || 0),
    genesisBlockTimestamp: +(genesisBlockTimestamp || 0),
    tipBlockTimestamp,
    timestamp: +(timestamp || 0),
    setApc,
  })

  // update withdrawing epochs if necessary
  hooks.useUpdateEpochs({ depositOutPoint, blockNumber, setWithdrawingEpoch })

  // parse current/deposit epoch info and convert them into number
  const currentEpochInfo = epochParser(currentEpoch)
  const currentEpochValue =
    Number(currentEpochInfo.number) + Number(currentEpochInfo.index) / Number(currentEpochInfo.length)
  const depositEpochInfo = epochParser(depositEpoch)
  const depositEpochValue =
    Number(depositEpochInfo.number) + Number(depositEpochInfo.index) / Number(depositEpochInfo.length)

  // update the stage of compensation
  const pastEpochsInPeriod = compensationPeriod
    ? +(currentEpochValue - compensationPeriod.targetEpochValue + WITHDRAW_EPOCHS).toFixed(1)
    : 0
  let compensationStage = 'stage1'
  if (pastEpochsInPeriod > 0.967 * WITHDRAW_EPOCHS) {
    compensationStage = 'stage3'
  } else if (pastEpochsInPeriod > 0.767 * WITHDRAW_EPOCHS) {
    compensationStage = 'stage2'
  }

  // get the compensation capacity
  const compensation = BigInt(withdrawCapacity || capacity) - BigInt(capacity)

  // update button status and meta info according to the status
  let ready = false
  let metaInfo = 'Ready'
  if (!depositOutPoint) {
    // cell is under deposit if depositOutPoint is null and the block number is where the deposit starts
    const duration = BigInt(tipBlockNumber) - BigInt(blockNumber)
    metaInfo = t('nervos-dao.compensation-accumulated', {
      blockNumber: localNumberFormatter(duration >= BigInt(0) ? duration : 0),
    })
  } else if (withdrawingEpoch) {
    // cell is under withdrawing if depositOutPoint is not null
    const withdrawingEpochInfo = epochParser(withdrawingEpoch)
    const withdrawEpochValue = calculateClaimEpochValue(depositEpochInfo, withdrawingEpochInfo) + IMMATURE_EPOCHS
    if (withdrawEpochValue <= currentEpochValue) {
      metaInfo = 'Ready'
      ready = true
    } else {
      const epochs = Math.floor(withdrawEpochValue - currentEpochValue)
      metaInfo = t('nervos-dao.blocks-left', {
        epochs: localNumberFormatter(epochs),
        blocks: localNumberFormatter(
          Math.floor(
            ((withdrawEpochValue * 100 - currentEpochValue * 100 - epochs * 100) * Number(currentEpochInfo.length)) /
              100
          )
        ),
        days: localNumberFormatter(Math.round(epochs / 6)),
      })
    }
  } else {
    // It's under withdrawing while withdraw epoch is loading
    metaInfo = '...'
  }

  const isActionAvailable =
    connectionStatus === 'online' &&
    ((depositOutPoint && ready) || (!depositOutPoint && currentEpochValue >= depositEpochValue + IMMATURE_EPOCHS))

  return (
    <div className={styles.container}>
      <div className={styles.compensation}>
        {compensation >= BigInt(0)
          ? `${depositOutPoint ? '' : '~'}${shannonToCKBFormatter(compensation.toString()).toString()} CKB`
          : ''}
      </div>
      <div className={styles.depositAmount}>{`${shannonToCKBFormatter(capacity)} CKB`}</div>
      {depositOutPoint || !compensationPeriod || connectionStatus === 'offline' ? null : (
        <div
          data-stage={compensationStage}
          data-block-hash={blockHash}
          role="button"
          className={styles.epochsDialogBtn}
          onClick={onCompensationPeriodExplanationClick}
          onKeyPress={onCompensationPeriodExplanationClick}
          tabIndex={0}
          aria-label={t('nervos-dao.explanation-of-epochs-period')}
          title={t('nervos-dao.explanation-of-epochs-period')}
        >
          <EpochBtn />
        </div>
      )}
      <div className={styles.actions}>
        <Button
          type="primary"
          data-tx-hash={txHash}
          data-index={index}
          onClick={onClick}
          disabled={!isActionAvailable}
          label={t(`nervos-dao.${depositOutPoint ? 'withdrawing' : 'deposited'}-action-label`)}
        />
      </div>
      <time className={styles.time}>{uniformTimeFormatter(+timestamp)}</time>
      <span className={styles.apc}>{`APC: ~${apc}%`}</span>
      <span className={styles.info}>{metaInfo}</span>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
