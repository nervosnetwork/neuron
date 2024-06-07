import React, { useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { MIN_AMOUNT, DAO_DATA } from 'utils/const'
import { isMainnet as isMainnetUtil, localNumberFormatter, shannonToCKBFormatter } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import styles from './amendPendingTransactionDialog.module.scss'
import { useInitialize, useOutputs } from './hooks'

const AmendPendingTransactionDialog = ({ tx, onClose }: { tx: State.Transaction; onClose: () => void }) => {
  const {
    wallet: { id: walletID = '', addresses },
    chain: { networkID },
    settings: { networks = [] },
    sUDTAccounts,
  } = useGlobalState()
  const { t } = useTranslation()

  const isMainnet = isMainnetUtil(networks, networkID)

  const {
    fee,
    price,
    setPrice,
    transaction,
    onSubmit,
    minPrice,
    isConfirmedAlertShown,
    password,
    onPwdChange,
    pwdError,
    generatedTx,
    setGeneratedTx,
    isSending,
  } = useInitialize({
    tx,
    walletID,
    t,
    onClose,
  })

  const { items, lastOutputsCapacity } = useOutputs({
    transaction,
    isMainnet,
    addresses,
    sUDTAccounts,
    fee,
  })

  const priceError = useMemo(() => {
    return Number(price) < Number(minPrice) ? t('price-switch.errorTip', { minPrice }) : null
  }, [price, minPrice])

  const inputHint = t('price-switch.hintTip', { suggestFeeRate: minPrice })

  const handlePriceChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value: inputValue } = e.currentTarget

      const value = inputValue.split('.')[0].replace(/[^\d]/g, '')
      setPrice(value)
    },
    [setPrice]
  )

  useEffect(() => {
    if (transaction && lastOutputsCapacity !== undefined) {
      const outputs = items.map(item => {
        const capacity = item.isLastOutput ? lastOutputsCapacity.toString() : item.capacity
        if (item.output.data === DAO_DATA) {
          // eslint-disable-next-line no-param-reassign
          item.output.daoData = DAO_DATA
        }
        return {
          ...item.output,
          capacity,
        }
      })

      setGeneratedTx({
        ...transaction,
        outputs,
      })
    }
  }, [lastOutputsCapacity, transaction, items, setGeneratedTx])

  const disabled = !!(
    isSending ||
    !generatedTx ||
    priceError ||
    lastOutputsCapacity === undefined ||
    lastOutputsCapacity < MIN_AMOUNT
  )

  return (
    <>
      <Dialog
        show
        title={t('send.amend-pending-transaction')}
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmText={t('send.send')}
        disabled={disabled}
        isLoading={isSending}
      >
        <div className={styles.content}>
          <TextField
            label={t('send.fee')}
            field="fee"
            value={`${shannonToCKBFormatter(fee.toString())} CKB`}
            readOnly
            disabled
            width="100%"
          />
          <TextField
            label={t('price-switch.customPrice')}
            field="price"
            value={localNumberFormatter(price)}
            onChange={handlePriceChange}
            suffix="shannons/kB"
            error={priceError}
            hint={!priceError && inputHint ? inputHint : null}
            width="100%"
          />

          <TextField
            className={styles.passwordInput}
            placeholder={t('password-request.placeholder')}
            width="100%"
            label={t('password-request.password')}
            value={password}
            field="password"
            type="password"
            title={t('password-request.password')}
            onChange={onPwdChange}
            autoFocus
            error={pwdError}
          />
        </div>
      </Dialog>
      <AlertDialog
        show={isConfirmedAlertShown}
        title={t('send.transaction-confirmed')}
        message={t('send.transaction-cannot-amend')}
        type="warning"
        onOk={onClose}
        action="ok"
      />
    </>
  )
}

AmendPendingTransactionDialog.displayName = 'AmendPendingTransactionDialog'

export default AmendPendingTransactionDialog
