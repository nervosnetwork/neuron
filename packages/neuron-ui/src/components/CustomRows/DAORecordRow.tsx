import React, { useEffect, useState, useMemo } from 'react'
import { DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { ckbCore, getBlockByNumber } from 'services/chain'
import { showMessage } from 'services/remote'
import calculateGlobalAPC from 'utils/calculateGlobalAPC'
import { shannonToCKBFormatter, uniformTimeFormatter, localNumberFormatter } from 'utils/formatters'
import calculateClaimEpochNumber from 'utils/calculateClaimEpochNumber'
import { epochParser } from 'utils/parsers'

import * as styles from './daoRecordRow.module.scss'

const DAORecord = ({
  daoData,
  blockNumber,
  outPoint: { txHash, index },
  tipBlockNumber,
  capacity,
  actionLabel,
  onClick,
  timestamp,
  genesisBlockTimestamp,
  depositTimestamp,
  depositOutPoint,
  epoch,
  withdraw,
  connectionStatus,
}: State.NervosDAORecord & {
  actionLabel: string
  onClick: any
  tipBlockNumber: string
  epoch: string
  withdraw: string | null
  genesisBlockTimestamp: number | undefined
  connectionStatus: 'online' | 'offline'
}) => {
  const [t] = useTranslation()
  const [withdrawingEpoch, setWithdrawingEpoch] = useState('')
  const [depositEpoch, setDepositEpoch] = useState('')
  const [apc, setApc] = useState(0)

  useEffect(() => {
    calculateGlobalAPC(+(depositTimestamp || timestamp), genesisBlockTimestamp).then(res => {
      setApc(res)
    })
  }, [depositTimestamp, timestamp, genesisBlockTimestamp])

  useEffect(() => {
    if (!depositOutPoint) {
      getBlockByNumber(BigInt(blockNumber))
        .then(b => {
          setDepositEpoch(b.header.epoch)
        })
        .catch((err: Error) => {
          console.error(err)
        })
      return
    }
    const depositBlockNumber = ckbCore.utils.bytesToHex(ckbCore.utils.hexToBytes(daoData).reverse())
    getBlockByNumber(BigInt(depositBlockNumber))
      .then(b => {
        setDepositEpoch(b.header.epoch)
      })
      .catch((err: Error) => {
        console.error(err)
      })

    getBlockByNumber(BigInt(blockNumber))
      .then(b => {
        setWithdrawingEpoch(b.header.epoch)
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
        days: localNumberFormatter(epochs / BigInt(6)),
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
          showMessage(
            {
              title: t('nervos-dao.insufficient-period-alert-title'),
              message: t('nervos-dao.insufficient-period-alert-title'),
              detail: t('nervos-dao.insufficient-period-alert-message'),
            },
            () => {}
          )
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
        <div>
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
        <span>{uniformTimeFormatter(+timestamp)}</span>
        <span>{metaInfo}</span>
      </div>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
