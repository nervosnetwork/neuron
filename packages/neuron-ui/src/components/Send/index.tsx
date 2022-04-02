import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from 'office-ui-fabric-react'

import { useState as useGlobalState, useDispatch, appState } from 'states'

import Balance from 'components/Balance'
import SendMetaInfo from 'components/SendMetaInfo'
import SendFieldset from 'components/SendFieldset'

import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import DatetimePicker from 'widgets/DatetimePicker'

import {
  getCurrentUrl,
  getSyncStatus,
  validateTotalAmount,
  isMainnet as isMainnetUtil,
  validateOutputs,
  useOutputErrors,
} from 'utils'

import { useInitialize } from './hooks'
import styles from './send.module.scss'

const Send = () => {
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
    },
    wallet: { id: walletID = '', balance = '', device },
    chain: {
      networkID,
      connectionStatus,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, bestKnownBlockTimestamp },
    },
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
    onItemChange: handleItemChange,
    onSubmit: handleSubmit,
    updateTransactionOutput,
    addTransactionOutput: handleOutputAdd,
    removeTransactionOutput: handleOutputRemove,
    updateTransactionPrice: handlePriceChange,
    onDescriptionChange: handleDescriptionChange,
    onClear: handleClear,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick: handleSendMaxClick,
    onScan: handleScan,
  } = useInitialize(walletID, send.outputs, send.generatedTx, send.price, sending, isMainnet, dispatch, t)

  const [locktimeIndex, setLocktimeIndex] = useState<number>(-1)

  const handleLocktimeClick = useCallback(
    e => {
      const {
        dataset: { index, type },
      } = e.target
      switch (type) {
        case 'set': {
          setLocktimeIndex(index)
          break
        }
        case 'remove': {
          updateTransactionOutput('date')(index)(undefined)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [setLocktimeIndex, updateTransactionOutput]
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
    bestKnownBlockNumber,
    bestKnownBlockTimestamp,
    cacheTipBlockNumber,
    currentTimestamp: Date.now(),
    url: getCurrentUrl(networkID, networks),
  })

  const outputErrors = useOutputErrors(outputs, isMainnet)

  const isMaxBtnDisabled = (() => {
    try {
      validateOutputs(outputs, isMainnet, true)
    } catch {
      return true
    }
    return false
  })()

  const isAddOneBtnDisabled = (() => {
    try {
      if (isSendMax) {
        return true
      }
      validateOutputs(outputs, isMainnet, false)
    } catch {
      return true
    }
    return false
  })()

  return (
    <form onSubmit={handleSubmit} data-wallet-id={walletID} data-status={disabled ? 'not-ready' : 'ready'}>
      <h1 className={styles.pageTitle}>{t('navbar.send')}</h1>
      <div className={styles.balance}>
        <Balance balance={balance} connectionStatus={connectionStatus} syncStatus={syncStatus} />
      </div>
      <div>
        <List
          items={outputs}
          onRenderCell={(_, idx) => {
            if (idx === undefined || outputs[idx] === undefined) {
              return null
            }

            const isRemoveBtnShow = outputs.length > 1
            const isAddBtnShow = outputs.length - 1 === idx
            const isMaxBtnShow = outputs.length - 1 === idx

            return (
              <SendFieldset
                item={outputs[idx]}
                idx={idx}
                errors={outputErrors[idx]}
                isMaxBtnDisabled={isMaxBtnDisabled}
                isAddOneBtnDisabled={isAddOneBtnDisabled}
                isSendMax={isSendMax}
                isAddBtnShow={isAddBtnShow}
                isRemoveBtnShow={isRemoveBtnShow}
                isMaxBtnShow={isMaxBtnShow}
                onOutputAdd={handleOutputAdd}
                onOutputRemove={handleOutputRemove}
                onItemChange={handleItemChange}
                onScan={handleScan}
                onSendMaxClick={handleSendMaxClick}
                onLocktimeClick={handleLocktimeClick}
                isTimeLockable={!device}
              />
            )
          }}
        />
      </div>

      <div className={styles.info}>
        <SendMetaInfo
          outputs={outputs}
          errorMessage={errorMessageUnderTotal}
          totalAmount={totalAmount}
          sending={sending}
          description={send.description}
          fee={fee}
          price={send.price}
          handleDescriptionChange={handleDescriptionChange}
          handlePriceChange={handlePriceChange}
        />
      </div>

      <div className={styles.actions}>
        <Button type="reset" onClick={handleClear} label={t('send.clear')} />
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
