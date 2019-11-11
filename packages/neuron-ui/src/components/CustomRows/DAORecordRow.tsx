import React, { useEffect, useState } from 'react'
import { DefaultButton } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { ckbCore, getBlockByNumber } from 'services/chain'
import calculateAPY from 'utils/calculateAPY'
import { shannonToCKBFormatter, uniformTimeFormatter, localNumberFormatter } from 'utils/formatters'
import calculateClaimEpochNumber from 'utils/calculateClaimEpochNumber'
import { epochParser } from 'utils/parsers'

import * as styles from './daoRecordRow.module.scss'

const DAORecord = ({
  daoData,
  blockNumber,
  blockHash,
  outPoint: { txHash, index },
  tipBlockNumber,
  tipBlockHash,
  capacity,
  actionLabel,
  onClick,
  timestamp,
  depositOutPoint,
  epoch,
}: State.NervosDAORecord & {
  actionLabel: string
  onClick: any
  tipBlockNumber: string
  tipBlockHash: string
  epoch: string
}) => {
  const [t] = useTranslation()
  const [withdrawValue, setWithdrawValue] = useState('')
  const [depositEpoch, setDepositEpoch] = useState('')

  useEffect(() => {
    const withdrawBlockHash = depositOutPoint ? blockHash : tipBlockHash
    if (!withdrawBlockHash) {
      return
    }
    const formattedDepositOutPoint = depositOutPoint
      ? {
          txHash: depositOutPoint.txHash,
          index: BigInt(depositOutPoint.index),
        }
      : {
          txHash,
          index: BigInt(index),
        }
    ;(ckbCore.rpc as any)
      .calculateDaoMaximumWithdraw(formattedDepositOutPoint, withdrawBlockHash)
      .then((res: string) => {
        setWithdrawValue(BigInt(res).toString())
      })
      .catch((err: Error) => {
        console.error(err)
      })
  }, [txHash, index, tipBlockHash, depositOutPoint, blockHash])

  useEffect(() => {
    if (!depositOutPoint) {
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
  }, [daoData, depositOutPoint])

  const interest = BigInt(withdrawValue) - BigInt(capacity)

  let ready = false
  let metaInfo = 'Ready'
  if (!depositOutPoint) {
    const duration = BigInt(tipBlockNumber) - BigInt(blockNumber)
    metaInfo = t('nervos-dao.interest-accumulated', {
      blockNumber: localNumberFormatter(duration >= BigInt(0) ? duration : 0),
    })
  } else {
    const depositEpochInfo = epochParser(depositEpoch)
    const currentEpochInfo = epochParser(epoch)
    const targetEpochNumber = calculateClaimEpochNumber(depositEpochInfo, currentEpochInfo)
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

  return (
    <div className={styles.daoRecord}>
      <div className={styles.primaryInfo}>
        <div>{interest >= BigInt(0) ? `${shannonToCKBFormatter(interest.toString()).toString()} CKB` : ''}</div>
        <div>{`${shannonToCKBFormatter(capacity)} CKB`}</div>
        <div>
          <DefaultButton
            text={actionLabel}
            data-tx-hash={txHash}
            data-index={index}
            onClick={onClick}
            disabled={depositOutPoint && !ready}
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
        <span>
          {`APY: ~${calculateAPY(
            interest >= BigInt(0) ? interest.toString() : '0',
            capacity,
            `${Date.now() - +timestamp}`
          )}%`}
        </span>
        <span>{uniformTimeFormatter(+timestamp)}</span>
        <span>{metaInfo}</span>
      </div>
    </div>
  )
}

DAORecord.displayName = 'DAORecord'

export default DAORecord
