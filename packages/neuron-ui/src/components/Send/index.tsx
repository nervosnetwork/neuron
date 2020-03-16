import React, { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Label, Text, List } from 'office-ui-fabric-react'
import { ckbCore } from 'services/chain'
import TransactionFeePanel from 'components/TransactionFeePanel'
import TextField from 'widgets/TextField'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { ReactComponent as Scan } from 'widgets/Icons/Scan.svg'
import AddOutput from 'widgets/Icons/AddOutput.png'
import RemoveOutput from 'widgets/Icons/RemoveOutput.png'
import Edit from 'widgets/Icons/Edit.png'
import ActiveEdit from 'widgets/Icons/ActiveEdit.png'
import Trash from 'widgets/Icons/Trash.png'
import ActiveTrash from 'widgets/Icons/ActiveTrash.png'
import Calendar from 'widgets/Icons/Calendar.png'
import ActiveCalendar from 'widgets/Icons/ActiveCalendar.png'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'

import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import appState from 'states/initStates/app'

import {
  PlaceHolders,
  ErrorCode,
  MAX_DECIMAL_DIGITS,
  MAINNET_TAG,
  SyncStatus,
  ConnectionStatus,
  SINCE_FIELD_SIZE,
} from 'utils/const'
import getSyncStatus from 'utils/getSyncStatus'
import getCurrentUrl from 'utils/getCurrentUrl'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'
import {
  verifyTotalAmount,
  verifyTransactionOutputs,
  verifyAmount,
  verifyAmountRange,
  verifyAddress,
} from 'utils/validators'

import DatetimePicker from 'widgets/DatetimePicker'
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
    updateTransactionOutput,
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

  const [locktimeIndex, setLocktimeIndex] = useState<number>(-1)

  const onLocktimeClick = useCallback(
    e => {
      const {
        dataset: { index },
      } = e.target
      setLocktimeIndex(index)
    },
    [setLocktimeIndex]
  )

  const onRemoveLocktime = useCallback(
    e => {
      const {
        dataset: { index },
      } = e.target
      updateTransactionOutput('date')(index)(undefined)
    },
    [updateTransactionOutput]
  )

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
    url: getCurrentUrl(networkID, networks),
  })

  const outputErrors = useMemo(() => {
    return outputs.map(({ address, amount, date }) => {
      let amountErrorCode = ''
      let addrErrorCode = ''
      const extraSize = date ? SINCE_FIELD_SIZE : 0

      const amountVeriMsg = verifyAmount(amount)
      if (amount !== undefined) {
        if (typeof amountVeriMsg === 'object') {
          amountErrorCode = `${amountVeriMsg.code}`
        } else if (!verifyAmountRange(amount, extraSize)) {
          amountErrorCode = extraSize ? `${ErrorCode.LocktimeAmountTooSmall}` : `${ErrorCode.AmountTooSmall}`
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

  let balancePrompt = null
  if (ConnectionStatus.Offline === connectionStatus) {
    balancePrompt = (
      <span className={styles.balancePrompt} style={{ color: 'red' }}>
        {t('sync.sync-failed')}
      </span>
    )
  } else if (SyncStatus.SyncNotStart === syncStatus) {
    balancePrompt = (
      <span className={styles.balancePrompt} style={{ color: 'red' }}>
        {t('sync.sync-not-start')}
      </span>
    )
  } else if ([SyncStatus.Syncing, SyncStatus.SyncPending].includes(syncStatus)) {
    balancePrompt = <span className={styles.balancePrompt}>{t('sync.syncing-balance')}</span>
  }

  return (
    <div style={{ padding: '39px 0 0 0' }}>
      <div className={styles.balance}>
        <div>
          <Label>{t('send.balance')}</Label>
        </div>
        <div>
          <Text>{`${shannonToCKBFormatter(balance)} CKB`}</Text>
          {balancePrompt}
        </div>
      </div>
      <div>
        <List
          items={outputs}
          onRenderCell={(item, idx) => {
            const SHORT_ADDR_LENGTH = 46
            const LOCKTIMEABLE_PREFIX = '0x0100'
            if (undefined === item || undefined === idx) {
              return null
            }
            const errorMsg = outputErrors[idx].addrErrorCode
              ? t(`messages.codes.${outputErrors[idx].addrErrorCode}`, {
                  fieldName: 'address',
                  fieldValue: item.address || '',
                })
              : undefined
            const fullAddrInfo =
              !errorMsg && item.address && item.address.length !== SHORT_ADDR_LENGTH ? t('messages.full-addr-info') : ''

            let locktimeAble = false
            if (!errorMsg && item.address && item.address.length === SHORT_ADDR_LENGTH) {
              try {
                const parsed = ckbCore.utils.bytesToHex(ckbCore.utils.parseAddress(item.address))
                if (parsed.startsWith(LOCKTIMEABLE_PREFIX)) {
                  locktimeAble = true
                }
              } catch {
                // ignore this
              }
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
                  error={errorMsg}
                />
                {fullAddrInfo ? (
                  <div className={styles.fullAddrInfo}>
                    <Attention />
                    <span>{fullAddrInfo}</span>
                  </div>
                ) : null}

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
                {locktimeAble ? (
                  <div className={styles.locktime} data-status={item.date ? 'set' : 'unset'}>
                    <img data-status="inactive" className={styles.icon} src={Calendar} alt="calendar" />
                    <img data-status="active" className={styles.icon} src={ActiveCalendar} alt="active-calendar" />
                    {item.date ? `${t('send.release-on')}: ${new Date(+item.date).toLocaleDateString()}` : null}
                    <button type="button" data-index={idx} onClick={onLocktimeClick}>
                      {item.date ? (
                        <>
                          <img data-status="inactive" className={styles.icon} src={Edit} alt="edit" />
                          <img data-status="active" className={styles.icon} src={ActiveEdit} alt="active-edit" />
                        </>
                      ) : (
                        t('send.set-locktime')
                      )}
                    </button>
                    {item.date ? (
                      <button type="button" data-index={idx} onClick={onRemoveLocktime}>
                        <img data-status="inactive" className={styles.icon} src={Trash} alt="trash" />
                        <img data-status="active" className={styles.icon} src={ActiveTrash} alt="active-trash" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
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

      {locktimeIndex > -1 ? (
        <div className={styles.datetimePicker}>
          <div className={styles.datetimeDialog}>
            <DatetimePicker
              onConfirm={(time: number) => {
                updateTransactionOutput('date')(locktimeIndex)(`${time}`)
                setLocktimeIndex(-1)
              }}
              preset={send.outputs[locktimeIndex]?.date}
              onCancel={() => setLocktimeIndex(-1)}
              title={t('send.set-locktime')}
              notice={t('send.locktime-notice-content')}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

Send.displayName = 'Send'

export default Send
