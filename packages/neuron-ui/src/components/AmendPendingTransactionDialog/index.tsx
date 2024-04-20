import React, { useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import { MIN_AMOUNT } from 'utils/const'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { isMainnet as isMainnetUtil, localNumberFormatter, shannonToCKBFormatter } from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import styles from './amendPendingTransactionDialog.module.scss'
import { useInitialize } from './hooks'

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
    showConfirmedAlert,
    password,
    onPwdChange,
    pwdError,
    generatedTx,
    setGeneratedTx,
    sending,
  } = useInitialize({
    tx,
    walletID,
    t,
    onClose,
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

  const getLastOutputAddress = (outputs: State.DetailedOutput[]) => {
    if (outputs.length === 1) {
      return scriptToAddress(outputs[0].lock, isMainnet)
    }

    const change = outputs.find(output => {
      const address = scriptToAddress(output.lock, isMainnet)
      return !!addresses.find(item => item.address === address && item.type === 1)
    })

    if (change) {
      return scriptToAddress(change.lock, isMainnet)
    }

    const receive = outputs.find(output => {
      const address = scriptToAddress(output.lock, isMainnet)
      return !!addresses.find(item => item.address === address && item.type === 0)
    })
    if (receive) {
      return scriptToAddress(receive.lock, isMainnet)
    }

    const sudt = outputs.find(output => {
      const address = scriptToAddress(output.lock, isMainnet)
      return !!sUDTAccounts.find(item => item.address === address)
    })
    if (sudt) {
      return scriptToAddress(sudt.lock, isMainnet)
    }
    return ''
  }

  const items: {
    address: string
    amount: string
    capacity: string
    isLastOutput: boolean
    output: State.DetailedOutput
  }[] = useMemo(() => {
    if (transaction && transaction.outputs.length) {
      const lastOutputAddress = getLastOutputAddress(transaction.outputs)
      return transaction.outputs.map(output => {
        const address = scriptToAddress(output.lock, isMainnet)
        return {
          capacity: output.capacity,
          address,
          output,
          amount: shannonToCKBFormatter(output.capacity || '0'),
          isLastOutput: address === lastOutputAddress,
        }
      })
    }
    return []
  }, [transaction?.outputs])

  const outputsCapacity = useMemo(() => {
    const outputList = items.filter(item => !item.isLastOutput)
    return outputList.reduce((total, cur) => {
      if (Number.isNaN(+(cur.capacity || ''))) {
        return total
      }
      return total + BigInt(cur.capacity || '0')
    }, BigInt(0))
  }, [items])

  const lastOutputsCapacity = useMemo(() => {
    if (transaction) {
      const inputsCapacity = transaction.inputs.reduce((total, cur) => {
        if (Number.isNaN(+(cur.capacity || ''))) {
          return total
        }
        return total + BigInt(cur.capacity || '0')
      }, BigInt(0))

      return inputsCapacity - outputsCapacity - fee
    }
    return -1
  }, [transaction, fee, outputsCapacity])

  useEffect(() => {
    if (transaction) {
      const outputs = items.map(item => {
        const capacity = item.isLastOutput ? lastOutputsCapacity.toString() : item.capacity
        if (item.output.data === '0x0000000000000000') {
          // eslint-disable-next-line no-param-reassign
          item.output.daoData = '0x0000000000000000'
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

  const disabled = !!(sending || !generatedTx || priceError || lastOutputsCapacity < MIN_AMOUNT)

  return (
    <>
      <Dialog
        show
        title={t('send.amend-pending-transaction')}
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmText={t('send.send')}
        disabled={disabled}
        isLoading={sending}
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
        show={showConfirmedAlert}
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
