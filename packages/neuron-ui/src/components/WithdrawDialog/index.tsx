import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CONSTANTS, shannonToCKBFormatter, localNumberFormatter, useCalculateEpochs } from 'utils'
import { calculateDaoMaximumWithdraw, getHeader } from 'services/chain'

import Dialog from 'widgets/Dialog'
import { Attention } from 'widgets/Icons/icon'
import styles from './withdrawDialog.module.scss'

const { WITHDRAW_EPOCHS } = CONSTANTS

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

  const { currentEpochInfo, targetEpochValue } = useCalculateEpochs({ depositEpoch, currentEpoch })

  const epochs = +(
    targetEpochValue -
    (Number(currentEpochInfo.number) + Number(currentEpochInfo.index) / Number(currentEpochInfo.length))
  ).toFixed(1)
  const message =
    epochs >= 0 ? (
      <>
        <Attention />
        {t('nervos-dao.notice-wait-time', {
          epochs: localNumberFormatter(epochs),
          blocks: localNumberFormatter(currentEpochInfo.length - currentEpochInfo.index),
          days: localNumberFormatter(Math.round(epochs / 6)),
        })}
      </>
    ) : (
      ''
    )

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
    <Dialog
      show={Boolean(record)}
      contentClassName={styles.content}
      title={t(`nervos-dao-detail.withdrawn`)}
      onCancel={onDismiss}
      onConfirm={onSubmit}
      cancelText={t('nervos-dao-detail.cancel')}
      confirmText={t('nervos-dao-detail.next')}
    >
      <>
        <div className={styles.depositAndCompensation}>
          <div className={styles.deposit}>
            <span>{`${t('nervos-dao.deposit')}(CKB) `}</span>
            <span className={styles.amount}>{`${shannonToCKBFormatter(record.capacity)}`}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.compensation}>
            <span>{`${t('nervos-dao.compensation')}(CKB)`}</span>
            <span className={styles.amount}>
              {withdrawValue
                ? `${shannonToCKBFormatter((BigInt(withdrawValue) - BigInt(record.capacity)).toString())}`
                : '--'}
            </span>
          </div>
        </div>

        <div className={styles.messages}>
          {message && <p className={styles.message}>{message}</p>}
          {alert && <p className={styles.errorMessage}>{alert}</p>}
        </div>
      </>
    </Dialog>
  )
}

WithdrawDialog.displayName = 'WithdrawDialog'

export default WithdrawDialog
