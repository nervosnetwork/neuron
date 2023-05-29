import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'

import { CONSTANTS, shannonToCKBFormatter, localNumberFormatter, useCalculateEpochs, useDialog } from 'utils'
import { getTransaction, getHeader } from 'services/chain'

import { calculateMaximumWithdraw } from '@nervosnetwork/ckb-sdk-utils'
import styles from './withdrawDialog.module.scss'

const { WITHDRAW_EPOCHS } = CONSTANTS

const WithdrawDialog = ({
  onDismiss,
  onSubmit,
  record,
  tipDao,
  currentEpoch,
}: {
  onDismiss: () => void
  onSubmit: () => void
  record: State.NervosDAORecord
  tipDao?: string
  currentEpoch: string
}) => {
  const [t] = useTranslation()
  const [depositEpoch, setDepositEpoch] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')

  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: record, dialogRef, onClose: onDismiss })

  useEffect(() => {
    if (record) {
      getHeader(record.blockHash)
        .then(header => {
          setDepositEpoch(header.epoch)
        })
        .catch((err: Error) => {
          console.error(err)
        })
    }
  }, [record])

  useEffect(() => {
    if (!record || !tipDao) {
      return
    }

    getTransaction(record.outPoint.txHash)
      .then(tx => {
        if (tx.txStatus.blockHash) {
          getHeader(tx.txStatus.blockHash).then(header => {
            setWithdrawValue(
              calculateMaximumWithdraw(
                tx.transaction.outputs[+record.outPoint.index],
                tx.transaction.outputsData[+record.outPoint.index],
                header.dao,
                tipDao
              )
            )
          })
        }
      })
      .catch((err: Error) => {
        console.error(err)
      })
  }, [record, tipDao])

  const { currentEpochInfo, targetEpochValue } = useCalculateEpochs({ depositEpoch, currentEpoch })

  const epochs = +(
    targetEpochValue -
    (Number(currentEpochInfo.number) + Number(currentEpochInfo.index) / Number(currentEpochInfo.length))
  ).toFixed(1)
  const message =
    epochs >= 0
      ? t('nervos-dao.notice-wait-time', {
          epochs: localNumberFormatter(epochs),
          blocks: localNumberFormatter(currentEpochInfo.length - currentEpochInfo.index),
          days: localNumberFormatter(Math.round(epochs / 6)),
        })
      : ''

  const alert =
    epochs <= 5 && epochs >= 0
      ? t('nervos-dao.withdraw-alert', {
          epochs: localNumberFormatter(epochs),
          hours: localNumberFormatter(epochs * 4),
          nextLeftEpochs: localNumberFormatter(epochs + WITHDRAW_EPOCHS),
          days: localNumberFormatter(Math.round((Number(epochs) + WITHDRAW_EPOCHS) / 6)),
        })
      : ''

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <h2
        className={styles.title}
        title={t('nervos-dao.withdraw-from-nervos-dao')}
        aria-label={t('nervos-dao.withdraw-from-nervos-dao')}
      >
        {t('nervos-dao.withdraw-from-nervos-dao')}
      </h2>
      {record ? (
        <>
          <p className={styles.deposit}>
            <span>{`${t('nervos-dao.deposit')}: `}</span>
            <span>{`${shannonToCKBFormatter(record.capacity)} CKB`}</span>
          </p>
          <p className={styles.compensation}>
            <span>{`${t('nervos-dao.compensation')}: `}</span>
            <span>
              {withdrawValue
                ? `${shannonToCKBFormatter((BigInt(withdrawValue) - BigInt(record.capacity)).toString())} CKB`
                : ''}
            </span>
          </p>
          <div>
            <p className={styles.message}>{message}</p>
            <p className={styles.errorMessage}>{alert}</p>
          </div>
        </>
      ) : null}
      <div className={styles.footer}>
        <Button type="cancel" onClick={onDismiss} label={t('nervos-dao.cancel')} />
        <Button type="submit" onClick={onSubmit} label={t('nervos-dao.proceed')} />
      </div>
    </dialog>
  )
}

WithdrawDialog.displayName = 'WithdrawDialog'

export default WithdrawDialog
