import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'
import { calculateDaoMaximumWithdraw, getHeader } from 'services/chain'
import { useCalculateEpochs, useDialog } from 'utils/hooks'

import styles from './withdrawDialog.module.scss'

const WithdrawDialog = ({
  onDismiss,
  onSubmit,
  record,
  tipBlockHash,
  currentEpoch,
}: {
  onDismiss: () => void
  onSubmit: () => void
  record: State.NervosDAORecord
  tipBlockHash: string
  currentEpoch: string
}) => {
  const [t] = useTranslation()
  const [depositEpoch, setDepositEpoch] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')

  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: record, dialogRef })

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
    if (!record || !tipBlockHash) {
      return
    }

    calculateDaoMaximumWithdraw(
      {
        txHash: record.outPoint.txHash,
        index: `0x${BigInt(record.outPoint.index).toString(16)}`,
      },
      tipBlockHash
    )
      .then((res: string) => {
        setWithdrawValue(res)
      })
      .catch((err: Error) => {
        console.error(err)
      })
  }, [record, tipBlockHash])

  const { currentEpochInfo, targetEpochNumber } = useCalculateEpochs({ depositEpoch, currentEpoch })

  const epochs = targetEpochNumber - currentEpochInfo.number - BigInt(1)
  const message =
    epochs >= BigInt(0)
      ? t('nervos-dao.notice-wait-time', {
          epochs: localNumberFormatter(epochs),
          blocks: localNumberFormatter(currentEpochInfo.length - currentEpochInfo.index),
          days: localNumberFormatter(Math.round(Number(epochs) / 6)),
        })
      : ''

  const alert =
    epochs <= BigInt(5) && epochs >= BigInt(0)
      ? t('nervos-dao.withdraw-alert', {
          epochs: localNumberFormatter(epochs),
          hours: localNumberFormatter(epochs * BigInt(4)),
          nextLeftEpochs: localNumberFormatter(epochs + BigInt(180)),
          days: localNumberFormatter(Math.round((Number(epochs) + 180) / 6)),
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
        <Button type="cancel" aria-label={t('nervos-dao.cancel')} onClick={onDismiss} label={t('nervos-dao.cancel')} />
        <Button type="submit" aria-label={t('nervos-dao.proceed')} onClick={onSubmit} label={t('nervos-dao.proceed')} />
      </div>
    </dialog>
  )
}

WithdrawDialog.displayName = 'WithdrawDialog'

export default WithdrawDialog
