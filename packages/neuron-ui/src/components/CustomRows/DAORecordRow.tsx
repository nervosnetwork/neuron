import React, { useEffect, useState, useMemo } from 'react'
import { DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { ckbCore, getHeaderByNumber } from 'services/chain'
import { showAlertDialog } from 'states/stateProvider/actionCreators'
import { AppActions } from 'states/stateProvider/reducer'
import calculateAPC from 'utils/calculateAPC'
import { MILLISECONDS_IN_YEAR } from 'utils/const'
import { shannonToCKBFormatter, uniformTimeFormatter, localNumberFormatter } from 'utils/formatters'
import calculateClaimEpochNumber from 'utils/calculateClaimEpochNumber'
import { epochParser } from 'utils/parsers'

import * as styles from './daoRecordRow.module.scss'

const DAORecord = ({
  blockHash,
  daoData,
  blockNumber,
  outPoint: { txHash, index },
  tipBlockNumber,
  tipBlockTimestamp,
  capacity,
  actionLabel,
  onClick,
  onCompensationPeriodExplanationClick,
  timestamp,
  genesisBlockTimestamp,
  depositTimestamp,
  depositOutPoint,
  epoch,
  compensationPeriod,
  withdraw,
  connectionStatus,
  dispatch,
}: State.NervosDAORecord & {
  actionLabel: string
  onClick: React.EventHandler<any>
  onCompensationPeriodExplanationClick: React.EventHandler<any>
  tipBlockNumber: string
  tipBlockTimestamp: number
  epoch: string
  compensationPeriod: {
    currentEpochNumber: bigint
    currentEpochIndex: bigint
    currentEpochLength: bigint
    targetEpochNumber: bigint
  } | null
  withdraw: string | null
  genesisBlockTimestamp: number | undefined
  connectionStatus: 'online' | 'offline'
  dispatch: React.Dispatch<{ type: AppActions.UpdateAlertDialog; payload: { title: string; message: string } }>
}) => {
  const [t] = useTranslation()
  const [withdrawingEpoch, setWithdrawingEpoch] = useState('')
  const [depositEpoch, setDepositEpoch] = useState('')
  const [apc, setApc] = useState(0)

  let pastEpochs = 0
  if (compensationPeriod) {
    pastEpochs =
      Number(compensationPeriod.currentEpochNumber) -
      Number(compensationPeriod.targetEpochNumber) +
      180 +
      (compensationPeriod.currentEpochLength === BigInt(0)
        ? 0
        : +(Number(compensationPeriod.currentEpochIndex) / Number(compensationPeriod.currentEpochLength)).toFixed(1))
  }
  let compensationStage = 'stage1'
  if (pastEpochs > 0.967 * 180) {
    compensationStage = 'stage3'
  } else if (pastEpochs > 0.767 * 180) {
    compensationStage = 'stage2'
  }

  useEffect(() => {
    if (depositTimestamp) {
      const startYearNumber = (+depositTimestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      const endYearNumber = (+timestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      try {
        const calculatedAPC = calculateAPC({
          startYearNumber,
          endYearNumber,
        })
        setApc(calculatedAPC)
      } catch (err) {
        console.error(err)
      }
    } else {
      const startYearNumber = (+timestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      const endYearNumber = (tipBlockTimestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      try {
        const calculatedAPC = calculateAPC({
          startYearNumber,
          endYearNumber,
        })
        setApc(calculatedAPC)
      } catch (err) {
        console.error(err)
      }
    }
  }, [depositTimestamp, tipBlockTimestamp, timestamp, genesisBlockTimestamp])

  useEffect(() => {
    if (!depositOutPoint) {
      getHeaderByNumber(BigInt(blockNumber))
        .then(header => {
          setDepositEpoch(header.epoch)
        })
        .catch((err: Error) => {
          console.error(err)
        })
      return
    }
    const depositBlockNumber = ckbCore.utils.bytesToHex(ckbCore.utils.hexToBytes(daoData).reverse())
    getHeaderByNumber(BigInt(depositBlockNumber))
      .then(header => {
        setDepositEpoch(header.epoch)
      })
      .catch((err: Error) => {
        console.error(err)
      })

    getHeaderByNumber(BigInt(blockNumber))
      .then(header => {
        setWithdrawingEpoch(header.epoch)
      })
      .catch((err: Error) => {
        console.error(err)
      })
  }, [daoData, depositOutPoint, blockNumber])

  const compensation = BigInt(withdraw || capacity) - BigInt(capacity)

  let ready = false
  let metaInfo = 'Ready'
  if (!depositOutPoint) {
    const duration = BigInt(tipBlockNumber) - BigInt(blockNumber)
    metaInfo = t('nervos-dao.compensation-accumulated', {
      blockNumber: localNumberFormatter(duration >= BigInt(0) ? duration : 0),
    })
  } else {
    const depositEpochInfo = epochParser(depositEpoch)
    const currentEpochInfo = epochParser(epoch)
    const withdrawingEpochInfo = epochParser(withdrawingEpoch)
    const targetEpochNumber = calculateClaimEpochNumber(depositEpochInfo, withdrawingEpochInfo)
    if (targetEpochNumber <= currentEpochInfo.number) {
      metaInfo = 'Ready'
      ready = true
    } else {
      const epochs = targetEpochNumber - currentEpochInfo.number - BigInt(1)
      metaInfo = t('nervos-dao.blocks-left', {
        epochs: localNumberFormatter(epochs),
        blocks: localNumberFormatter(currentEpochInfo.length - currentEpochInfo.index),
        days: localNumberFormatter(Math.round(Number(epochs) / 6)),
      })
    }
  }

  const onActionClick = useMemo(() => {
    const currentEpochInfo = epochParser(epoch)
    const thresholdEpoch = withdrawingEpoch || depositEpoch
    if (thresholdEpoch) {
      const thresholdEpochInfo = epochParser(thresholdEpoch)
      if (thresholdEpochInfo.number + BigInt(4) >= currentEpochInfo.number) {
        return () =>
          showAlertDialog({
            title: t('nervos-dao.insufficient-period-alert-title'),
            message: t('nervos-dao.insufficient-period-alert-message'),
          })(dispatch)
      }
    }
    return onClick
  }, [onClick, epoch, depositEpoch, withdrawingEpoch, t])

  return (
    <div className={`${styles.daoRecord} ${depositOutPoint ? styles.isClaim : ''}`}>
      <div className={styles.primaryInfo}>
        <div>
          {compensation >= BigInt(0)
            ? `${depositOutPoint ? '' : '~'}${shannonToCKBFormatter(compensation.toString()).toString()} CKB`
            : ''}
        </div>
        <div>{`${shannonToCKBFormatter(capacity)} CKB`}</div>
        <div className={styles.actions}>
          {depositOutPoint || !compensationPeriod || connectionStatus === 'offline' ? null : (
            <span
              data-stage={compensationStage}
              data-block-hash={blockHash}
              role="button"
              className={styles.epochsDialogBtn}
              onClick={onCompensationPeriodExplanationClick}
              onKeyPress={onCompensationPeriodExplanationClick}
              tabIndex={0}
              aria-label={t('nervos-dao.explanation-of-epochs-period')}
              title={t('nervos-dao.explanation-of-epochs-period')}
            />
          )}
          <DefaultButton
            text={actionLabel}
            data-tx-hash={txHash}
            data-index={index}
            onClick={onActionClick}
            disabled={connectionStatus === 'offline' || (depositOutPoint && !ready)}
            styles={{
              flexContainer: {
                pointerEvents: 'none',
              },
              textContainer: {
                pointerEvents: 'none',
              },
              label: {
                pointerEvents: 'none',
              },
            }}
          />
        </div>
      </div>
      <div className={styles.secondaryInfo}>
        <span>{`APC: ~${apc}%`}</span>
        <span>{t('nervos-dao.deposit-at', { time: uniformTimeFormatter(+timestamp) })}</span>
        <span>{metaInfo}</span>
      </div>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
