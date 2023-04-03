import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from 'office-ui-fabric-react'
import { useState as useGlobalState, useDispatch, appState } from 'states'
import SendMetaInfo from 'components/SendMetaInfo'
import SendFieldset from 'components/SendFieldset'

import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import DatetimePickerDialog from 'widgets/DatetimePickerDialog'
import { ReactComponent as Add } from 'widgets/Icons/Add.svg'

import { validateTotalAmount, isMainnet as isMainnetUtil, validateOutputs, useOutputErrors } from 'utils'

import { isErrorWithI18n } from 'exceptions'
import { useInitialize } from './hooks'
import styles from './send.module.scss'

const Send = () => {
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
    },
    wallet: { id: walletID = '', balance = '', device },
    chain: { networkID, connectionStatus },
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
  } = useInitialize(walletID, send.outputs, send.generatedTx, send.price, sending, isMainnet, dispatch, t)

  const [locktimeIndex, setLocktimeIndex] = useState<number>(-1)

  const handleLocktimeClick = useCallback(
    (e: React.BaseSyntheticEvent) => {
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
    if (isErrorWithI18n(err)) {
      errorMessageUnderTotal = t(err.message)
    }
  }

  const disabled = connectionStatus === 'offline' || sending || !!errorMessageUnderTotal || !send.generatedTx

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
    <div className={styles.container}>
      <form onSubmit={handleSubmit} data-wallet-id={walletID} data-status={disabled ? 'not-ready' : 'ready'}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className={styles.leftContent}>
              <List
                items={outputs}
                onRenderCell={(_, idx) => {
                  if (idx === undefined || outputs[idx] === undefined) {
                    return null
                  }

                  const isRemoveBtnShow = outputs.length > 1
                  const isMaxBtnShow = outputs.length - 1 === idx

                  return (
                    <SendFieldset
                      item={outputs[idx]}
                      idx={idx}
                      errors={outputErrors[idx]}
                      isMaxBtnDisabled={isMaxBtnDisabled}
                      isSendMax={isSendMax}
                      isRemoveBtnShow={isRemoveBtnShow}
                      isMaxBtnShow={isMaxBtnShow}
                      onOutputRemove={handleOutputRemove}
                      onItemChange={handleItemChange}
                      onSendMaxClick={handleSendMaxClick}
                      onLocktimeClick={handleLocktimeClick}
                      isTimeLockable={!device}
                    />
                  )
                }}
              />
            </div>
            <div className={styles.leftFooter}>
              <Button
                type="primary"
                disabled={isAddOneBtnDisabled}
                onClick={handleOutputAdd}
                className={styles.addButton}
              >
                <>
                  <Add className={styles.addButton_icon} /> {t('send.add-receiving-address')}
                </>
              </Button>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.rightContent}>
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
            <div className={styles.rightFooter}>
              <Button type="reset" onClick={handleClear} label={t('send.reset')} />
              <Button type="submit" disabled={disabled} label={t('send.send')}>
                {sending ? <Spinner /> : (t('send.send') as string)}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <DatetimePickerDialog
        show={locktimeIndex > -1}
        notice={t('send.locktime-notice-content')}
        preset={send.outputs[locktimeIndex]?.date}
        onConfirm={(time: number) => {
          updateTransactionOutput('date')(locktimeIndex)(`${time}`)
          setLocktimeIndex(-1)
        }}
        onCancel={() => {
          setLocktimeIndex(-1)
        }}
      />
    </div>
  )
}

Send.displayName = 'Send'

export default Send
