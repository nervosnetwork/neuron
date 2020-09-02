import React, { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from 'office-ui-fabric-react'

import { ckbCore } from 'services/chain'
import { useState as useGlobalState, useDispatch, appState } from 'states'

import TransactionFeePanel from 'components/TransactionFeePanel'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'

import TextField from 'widgets/TextField'
import CopyZone from 'widgets/CopyZone'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import DatetimePicker, { formatDate } from 'widgets/DatetimePicker'

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

import {
  PlaceHolders,
  CONSTANTS,
  shannonToCKBFormatter,
  localNumberFormatter,
  getCurrentUrl,
  getSyncStatus,
  validateOutputs,
  validateAmount,
  validateAmountRange,
  validateAddress,
  validateTotalAmount,
  isMainnet as isMainnetUtil,
} from 'utils'

import { useInitialize } from './hooks'
import styles from './send.module.scss'

const { SINCE_FIELD_SIZE } = CONSTANTS

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
  const isMainnet = isMainnetUtil(networks, networkID)
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
  } = useInitialize(walletID, send.outputs, send.generatedTx, send.price, sending, isMainnet, dispatch, t)

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

  useOnTransactionChange(
    walletID,
    outputs,
    send.price,
    isMainnet,
    dispatch,
    isSendMax,
    setTotalAmount,
    setErrorMessage,
    t
  )

  let errorMessageUnderTotal = errorMessage
  try {
    validateTotalAmount(totalAmount, fee, balance)
  } catch (err) {
    errorMessageUnderTotal = t(err.message)
  }

  const disabled = connectionStatus === 'offline' || sending || !!errorMessageUnderTotal || !send.generatedTx

  const syncStatus = getSyncStatus({
    tipBlockNumber,
    syncedBlockNumber,
    tipBlockTimestamp,
    currentTimestamp: Date.now(),
    url: getCurrentUrl(networkID, networks),
  })

  const outputErrors = useMemo(() => {
    return outputs.map(({ address, amount, date }) => {
      let amountError: (Error & { i18n: { [key: string]: string } }) | undefined
      let addrError: (Error & { i18n: { [key: string]: string } }) | undefined

      if (amount !== undefined) {
        try {
          const extraSize = date ? SINCE_FIELD_SIZE : 0
          validateAmount(amount)
          validateAmountRange(amount, extraSize)
        } catch (err) {
          amountError = err
        }
      }

      if (address !== undefined) {
        try {
          validateAddress(address, isMainnet)
        } catch (err) {
          addrError = err
        }
      }

      return {
        addrError,
        amountError,
      }
    })
  }, [outputs, isMainnet])

  return (
    <form onSubmit={onSubmit} data-wallet-id={walletID} data-status={disabled ? 'not-ready' : 'ready'}>
      <h1 className={styles.pageTitle}>{t('navbar.send')}</h1>
      <div className={styles.balance}>
        <span>{`${t('overview.balance')}:`}</span>
        <CopyZone content={shannonToCKBFormatter(balance, false, '')} name={t('overview.copy-balance')}>
          <span className={styles.balanceValue}>{shannonToCKBFormatter(balance)}</span>
        </CopyZone>
        <BalanceSyncIcon connectionStatus={connectionStatus} syncStatus={syncStatus} />
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
            const outputError = outputErrors[idx]

            const amountErrorMsg = outputError.amountError
              ? t(outputError.amountError.message, outputError.amountError.i18n)
              : ''

            const addrErrorMsg = outputError.addrError
              ? t(outputError.addrError.message, outputError.addrError.i18n)
              : ''

            const fullAddrInfo =
              !addrErrorMsg && item.address && item.address.length !== SHORT_ADDR_LENGTH
                ? t('messages.full-addr-info')
                : ''

            let locktimeAble = false
            if (!addrErrorMsg && item.address && item.address.length === SHORT_ADDR_LENGTH) {
              try {
                const parsed = ckbCore.utils.bytesToHex(ckbCore.utils.parseAddress(item.address))
                if (parsed.startsWith(LOCKTIMEABLE_PREFIX)) {
                  locktimeAble = true
                }
              } catch {
                // ignore this
              }
            }

            let isMaxBtnDisabled = false
            let isAddOneBtnDisabled = false

            try {
              validateOutputs(outputs, isMainnet, true)
            } catch {
              isMaxBtnDisabled = true
            }

            try {
              if (isSendMax) {
                isAddOneBtnDisabled = true
              } else {
                validateOutputs(outputs, isMainnet, false)
              }
            } catch {
              isAddOneBtnDisabled = true
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
                  error={addrErrorMsg}
                  autoFocus
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
                  error={amountErrorMsg}
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
                    disabled={isMaxBtnDisabled}
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
                      disabled={isAddOneBtnDisabled}
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
                    {item.date ? `${t('send.release-on')}: ${formatDate(new Date(+item.date))}` : null}
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
          disabled={sending}
        />
        <TransactionFeePanel
          fee={shannonToCKBFormatter(fee)}
          price={send.price}
          onPriceChange={updateTransactionPrice}
        />
      </div>

      <div className={styles.actions}>
        <Button type="reset" onClick={onClear} label={t('send.clear')} />
        <Button type="submit" disabled={disabled} label={t('send.send')}>
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
    </form>
  )
}

Send.displayName = 'Send'

export default Send
