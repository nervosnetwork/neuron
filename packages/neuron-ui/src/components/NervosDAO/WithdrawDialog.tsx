import React, { useState, useEffect } from 'react'
import { Dialog, DialogFooter, DefaultButton, PrimaryButton, DialogType, Text } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'
import { ckbCore } from 'services/chain'
import calculateTargetEpochNumber from 'utils/calculateClaimEpochNumber'
import { epochParser } from 'utils/parsers'

const WithdrawDialog = ({
  onDismiss,
  onSubmit,
  record,
  tipBlockHash,
  currentEpoch,
}: {
  onDismiss: any
  onSubmit: any
  record: State.NervosDAORecord
  tipBlockHash: string
  currentEpoch: string
}) => {
  const [t] = useTranslation()
  const [depositEpoch, setDepositEpoch] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  useEffect(() => {
    if (!record) {
      return
    }
    ckbCore.rpc
      .getBlock(record.blockHash)
      .then(b => {
        setDepositEpoch(b.header.epoch)
      })
      .catch((err: Error) => {
        console.error(err)
      })
  }, [record])
  useEffect(() => {
    if (!record || !tipBlockHash) {
      return
    }

    ;(ckbCore.rpc as any)
      .calculateDaoMaximumWithdraw(
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

  const depositEpochInfo = epochParser(depositEpoch)
  const currentEpochInfo = epochParser(currentEpoch)
  const targetEpochNumber = calculateTargetEpochNumber(depositEpochInfo, currentEpochInfo)
  const epochs = targetEpochNumber - currentEpochInfo.number - BigInt(1)
  const message = t('nervos-dao.notice-wait-time', {
    epochs: localNumberFormatter(epochs),
    blocks: localNumberFormatter(currentEpochInfo.length - currentEpochInfo.index),
    days: localNumberFormatter(epochs / BigInt(6)),
  })

  const alert =
    epochs <= BigInt(5)
      ? t('nervos-dao.withdraw-alert', {
          epochs,
          nextLeftEpochs: epochs + BigInt(180),
          days: (epochs + BigInt(180)) / BigInt(6),
        })
      : ''

  return (
    <Dialog
      hidden={!record}
      onDismiss={onDismiss}
      dialogContentProps={{ type: DialogType.close, title: t('nervos-dao.withdraw-from-nervos-dao') }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: '500px!important' } },
      }}
    >
      {record ? (
        <>
          <Text as="p" variant="large" block>
            <span>{`${t('nervos-dao.deposit')}: `}</span>
            <span>{`${shannonToCKBFormatter(record.capacity)} CKB`}</span>
          </Text>
          <Text as="p" variant="large" block>
            <span>{`${t('nervos-dao.allowance-for-locking')}: `}</span>
            <span>
              {withdrawValue
                ? `${shannonToCKBFormatter((BigInt(withdrawValue) - BigInt(record.capacity)).toString())} CKB`
                : ''}
            </span>
          </Text>
          <div>
            <Text as="p" variant="small" block>
              {message}
            </Text>
            <Text as="p" variant="xSmall" block styles={{ root: { color: 'red' } }}>
              {alert}
            </Text>
          </div>
        </>
      ) : null}
      <DialogFooter>
        <DefaultButton text={t('nervos-dao.cancel')} onClick={onDismiss} />
        <PrimaryButton text={t('nervos-dao.proceed')} onClick={onSubmit} />
      </DialogFooter>
    </Dialog>
  )
}

WithdrawDialog.displayName = 'WithdrawDialog'

export default WithdrawDialog
