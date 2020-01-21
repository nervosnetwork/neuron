import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Label, Text, List } from 'office-ui-fabric-react'
import TransactionFeePanel from 'components/TransactionFeePanel'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { ReactComponent as Scan } from 'widgets/Icons/Scan.svg'
import AddOutput from 'widgets/Icons/AddOutput.png'
import RemoveOutput from 'widgets/Icons/RemoveOutput.png'

import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import appState from 'states/initStates/app'

import { PlaceHolders, ErrorCode, MAX_DECIMAL_DIGITS, MAINNET_TAG, SyncStatus } from 'utils/const'
import getSyncStatus from 'utils/getSyncStatus'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'
import {
  verifyTotalAmount,
  verifyTransactionOutputs,
  verifyAmount,
  verifyAmountRange,
  verifyAddress,
} from 'utils/validators'

import { useInitialize } from './hooks'
import styles from './send.module.scss'

const Send = () => {
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      tipBlockNumber,
      tipBlockTimestamp,
    },
    wallet: { id: walletID = '', balance = '' },
    chain: { networkID, connectionStatus, tipBlockNumber: syncedBlockNumber },
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const {
    outputs,
    fee,
    totalAmount,
    setTotalAmount,
    useOnTransactionChange,
    onItemChange,
    onSubmit,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onClear,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick,
    onScan,
  } = useInitialize(walletID, send.outputs, send.generatedTx, send.price, sending, dispatch, t)
  useOnTransactionChange(walletID, outputs, send.price, dispatch, isSendMax, setTotalAmount, setErrorMessage, t)
  const errorMessageUnderTotal = verifyTotalAmount(totalAmount, fee, balance)
    ? errorMessage
    : t(`messages.codes.${ErrorCode.AmountNotEnough}`)
  const network = networks.find(n => n.id === networkID)

  const syncStatus = getSyncStatus({
    tipBlockNumber,
    syncedBlockNumber,
    tipBlockTimestamp,
    currentTimestamp: Date.now(),
  })

  const outputErrors = useMemo(() => {
    return outputs.map(({ address, amount }) => {
      let amountErrorCode = ''
      let addrErrorCode = ''

      const amountVeriMsg = verifyAmount(amount)
      if (amount !== undefined) {
        if (typeof amountVeriMsg === 'object') {
          amountErrorCode = `${amountVeriMsg.code}`
        } else if (!verifyAmountRange(amount)) {
          amountErrorCode = `${ErrorCode.AmountTooSmall}`
        }
      }
      if (address !== undefined) {
        const chainType = network ? network.chain : ''
        if (address === '') {
          addrErrorCode = `${ErrorCode.AddressIsEmpty}`
        } else if (chainType === MAINNET_TAG && !address.startsWith('ckb')) {
          addrErrorCode = `${ErrorCode.MainnetAddressRequired}`
        } else if (chainType !== MAINNET_TAG && !address.startsWith('ckt')) {
          addrErrorCode = `${ErrorCode.TestnetAddressRequired}`
        } else if (!verifyAddress(address)) {
          addrErrorCode = `${ErrorCode.FieldInvalid}`
        }
      }

      return {
        addrErrorCode,
        amountErrorCode,
      }
    })
  }, [outputs, network])

  return (
    <div style={{ padding: '39px 0 0 0' }}>
      <div className={styles.balance}>
        <div>
          <Label>{t('send.balance')}</Label>
        </div>
        <div>
          <Text>{`${shannonToCKBFormatter(balance)} CKB`}</Text>
          {SyncStatus.Syncing === syncStatus ? (
            <span className={styles.balancePrompt}>{t('sync.syncing-balance')}</span>
          ) : null}
        </div>
      </div>
      <div>
        <List
          items={outputs}
          onRenderCell={(item, idx) => {
            if (undefined === item || undefined === idx) {
              return null
            }
            return (
              <div className={styles.outputContainer}>
                <TextField
                  className={styles.addressField}
                  label={t('send.address')}
                  field="address"
                  data-idx={idx}
                  disabled={item.disabled}
                  value={item.address || ''}
                  onChange={onItemChange}
                  required
                  maxLength={100}
                  error={
                    outputErrors[idx].addrErrorCode
                      ? t(`messages.codes.${outputErrors[idx].addrErrorCode}`, {
                          fieldName: 'address',
                          fieldValue: item.address || '',
                        })
                      : undefined
                  }
                />

                <TextField
                  className={styles.amountField}
                  label={t('send.amount')}
                  field="amount"
                  data-idx={idx}
                  value={localNumberFormatter(item.amount)}
                  placeholder={isSendMax ? PlaceHolders.send.Calculating : PlaceHolders.send.Amount}
                  onChange={onItemChange}
                  disabled={item.disabled}
                  required
                  suffix="CKB"
                  error={
                    outputErrors[idx].amountErrorCode
                      ? t(`messages.codes.${outputErrors[idx].amountErrorCode}`, {
                          fieldName: 'amount',
                          fieldValue: localNumberFormatter(item.amount),
                          amount: localNumberFormatter(item.amount),
                          length: MAX_DECIMAL_DIGITS,
                        })
                      : ''
                  }
                />
                <button
                  data-idx={idx}
                  style={styles && styles.trigger}
                  onClick={onScan}
                  type="button"
                  aria-label="qr-btn"
                  className={styles.scanBtn}
                  data-title={t('send.scan-screen-qr-code')}
                >
                  <Scan />
                </button>

                {idx === outputs.length - 1 ? (
                  <Button
                    className={styles.maxBtn}
                    type="primary"
                    onClick={onSendMaxClick}
                    disabled={!verifyTransactionOutputs(outputs, true)}
                    label="Max"
                    data-is-on={isSendMax}
                  />
                ) : null}

                <div className={styles.iconBtns}>
                  {outputs.length > 1 ? (
                    <button
                      type="button"
                      disabled={isSendMax}
                      aria-label={t('send.remove-this')}
                      onClick={() => removeTransactionOutput(idx)}
                      className={styles.iconBtn}
                    >
                      <img src={RemoveOutput} alt="Remove Output" data-type="remove" />
                    </button>
                  ) : null}
                  {idx === outputs.length - 1 ? (
                    <button
                      type="button"
                      disabled={!verifyTransactionOutputs(outputs, false) || isSendMax}
                      onClick={() => addTransactionOutput()}
                      aria-label={t('send.add-one')}
                      className={styles.iconBtn}
                    >
                      <img src={AddOutput} alt="Add Output" data-type="add" />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          }}
        />
      </div>

      <div className={styles.info}>
        {outputs.length > 1 || errorMessageUnderTotal ? (
          <TextField
            field="totalAmount"
            label={t('send.total-amount')}
            value={`${shannonToCKBFormatter(totalAmount)} CKB`}
            readOnly
            error={errorMessageUnderTotal}
          />
        ) : null}
        <TextField
          field="description"
          label={t('send.description')}
          value={send.description}
          onChange={onDescriptionChange}
        />
        <TransactionFeePanel
          fee={shannonToCKBFormatter(fee)}
          price={send.price}
          onPriceChange={updateTransactionPrice}
        />
      </div>

      <div className={styles.actions}>
        <Button type="reset" onClick={onClear} label={t('send.clear')} />
        <Button
          type="submit"
          onClick={onSubmit(walletID)}
          disabled={connectionStatus === 'offline' || sending || !!errorMessageUnderTotal || !send.generatedTx}
          label={t('send.send')}
        >
          {sending ? <Spinner /> : (t('send.send') as string)}
        </Button>
      </div>
    </div>
  )
}

Send.displayName = 'Send'

export default Send
