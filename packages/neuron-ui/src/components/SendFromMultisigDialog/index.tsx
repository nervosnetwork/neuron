import React, { useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { MultisigConfig } from 'services/remote'
import Tooltip from 'widgets/Tooltip'
import { Copy } from 'widgets/Icons/icon'
import CopyZone from 'widgets/CopyZone'
import TextField from 'widgets/TextField'
import SendFieldset from 'components/SendFieldset'
import { calculateFee, isMainnet as isMainnetUtil, shannonToCKBFormatter, validateTotalAmount } from 'utils'
import { useState as useGlobalState } from 'states'
import { ReactComponent as Add } from 'widgets/Icons/Add.svg'
import Button from 'widgets/Button'
import Dialog from 'widgets/Dialog'

import { AmountNotEnoughException } from 'exceptions'
import { useSendInfo, useOnSumbit, useExport, useCanSign } from './hooks'
import styles from './sendFromMultisigDialog.module.scss'

const SendFromMultisigDialog = ({
  multisigConfig,
  balance = '0',
  closeDialog,
}: {
  multisigConfig: MultisigConfig
  balance: string
  closeDialog: () => void
}) => {
  const [t] = useTranslation()
  const {
    app: {
      send: { generatedTx },
    },
    chain: { networkID },
    settings: { networks = [] },
    wallet,
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const {
    sendInfoList,
    outputErrors,
    deleteSendInfo,
    onSendInfoChange,
    totalAmount,
    errorMessage,
    onSendMaxClick,
    isSendMax,
    isMaxBtnDisabled,
    addSendInfo,
    isAddOneBtnDisabled,
  } = useSendInfo({ isMainnet, balance, multisigConfig, t })
  const fee = useMemo(() => calculateFee(generatedTx), [generatedTx])
  const totalAmountErrorMessage = useMemo(() => {
    let errorMessageUnderTotal = errorMessage
    try {
      validateTotalAmount(totalAmount, fee, balance)
    } catch (err) {
      // `AmountNotEnoughException` is the only possible Error thrown by `validateTotalAmount`
      if (err instanceof AmountNotEnoughException) {
        errorMessageUnderTotal = t(err.message)
      }
    }
    return errorMessageUnderTotal
  }, [errorMessage, totalAmount, balance, t, fee])
  const isSendDisabled = useMemo(
    () =>
      outputErrors.some(v => v.addrError || v.amountError) ||
      sendInfoList.some(v => !v.address || !v.amount) ||
      !!totalAmountErrorMessage,
    [outputErrors, sendInfoList, totalAmountErrorMessage]
  )
  const onSumbit = useOnSumbit({ outputs: sendInfoList, isMainnet, multisigConfig, closeDialog })
  const onExport = useExport({ generatedTx, closeDialog })
  const canSign = useCanSign({ addresses: wallet.addresses, multisigConfig })
  return (
    <Dialog
      show
      title={t('multisig-address.send-ckb.title')}
      onCancel={closeDialog}
      cancelText={t('multisig-address.send-ckb.cancel')}
      confirmText={canSign ? t('multisig-address.send-ckb.send') : t('multisig-address.send-ckb.export')}
      onConfirm={canSign ? onSumbit : onExport}
      disabled={isSendDisabled}
      confirmProps={{
        'data-wallet-id': wallet.id,
      }}
      contentClassName={styles.dialogContainer}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Tooltip
            tipClassName={styles.tip}
            placement="right-bottom"
            tip={
              <CopyZone content={multisigConfig.fullPayload} className={styles.copyTableAddress}>
                {multisigConfig.fullPayload}
                <Copy />
              </CopyZone>
            }
            showTriangle
            isTriggerNextToChild
          >
            <div>
              <Trans
                i18nKey="multisig-address.send-ckb.detail"
                values={multisigConfig}
                components={[
                  <span className={styles.address}>
                    <span>{multisigConfig.fullPayload.slice(0, 6)}</span>
                    <span>...</span>
                    <span>{multisigConfig.fullPayload.slice(-6)}</span>
                  </span>,
                ]}
              />
            </div>
          </Tooltip>

          <div className={styles.balance}>
            {t('overview.balance')}: {shannonToCKBFormatter(balance)} CKB
          </div>
        </div>
        <div className={styles.sendContainer}>
          <div className={styles.sendFieldContainer}>
            {sendInfoList.map((item, idx) => (
              <SendFieldset
                key={item.address || idx}
                idx={idx}
                item={item}
                errors={outputErrors[idx]}
                isSendMax={isSendMax}
                isMaxBtnDisabled={isMaxBtnDisabled}
                isTimeLockable={false}
                isMaxBtnShow={false}
                isRemoveBtnShow={sendInfoList.length > 1}
                onOutputRemove={deleteSendInfo}
                onItemChange={onSendInfoChange}
                onSendMaxClick={onSendMaxClick}
                className={styles.flexWrap}
              />
            ))}
          </div>

          <div className={styles.addWrap}>
            <Button type="text" className={styles.addButton} disabled={isAddOneBtnDisabled} onClick={addSendInfo}>
              <Add /> {t('send.add-receiving-address')}
            </Button>
          </div>

          <div className={styles.flexWrap}>
            <TextField
              field="totalAmount"
              label={t('send.total-amount')}
              value={`${shannonToCKBFormatter(totalAmount)} CKB`}
              readOnly
              error={totalAmountErrorMessage}
              width="100%"
            />
            <TextField
              label={t('send.fee')}
              field="fee"
              value={`${shannonToCKBFormatter(fee)} CKB`}
              readOnly
              disabled
              width="100%"
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
}

SendFromMultisigDialog.displayName = 'SendFromMultisigDialog'

export default SendFromMultisigDialog
