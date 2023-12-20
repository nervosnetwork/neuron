import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { List } from 'office-ui-fabric-react'
import { useState as useGlobalState, useDispatch, appState, AppActions } from 'states'
import SendMetaInfo from 'components/SendMetaInfo'
import SendFieldset from 'components/SendFieldset'
import PageContainer from 'components/PageContainer'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import DatetimePickerDialog from 'widgets/DatetimePickerDialog'
import { GoBack, EyesOpen, EyesClose, Add } from 'widgets/Icons/icon'

import {
  validateTotalAmount,
  isMainnet as isMainnetUtil,
  validateOutputs,
  useOutputErrors,
  shannonToCKBFormatter,
  useGoBack,
} from 'utils'
import { HIDE_BALANCE } from 'utils/const'

import { isErrorWithI18n } from 'exceptions'
import { useSearchParams } from 'react-router-dom'
import { useInitialize, useSendWithSentCell } from './hooks'
import styles from './send.module.scss'

const SendHeader = ({ balance, useConsumeCell }: { balance: string; useConsumeCell: boolean }) => {
  const { t } = useTranslation()
  const onBack = useGoBack()

  const [showBalance, setShowBalance] = useState(true)
  const onChangeShowBalance = useCallback(() => {
    setShowBalance(v => !v)
  }, [setShowBalance])

  return (
    <div className={styles.headerContainer}>
      <GoBack className={styles.goBack} onClick={onBack} />
      <p>{t('navbar.send')}</p>
      {useConsumeCell ? null : (
        <>
          <Button className={styles.btn} type="text" onClick={onChangeShowBalance}>
            {showBalance ? <EyesOpen /> : <EyesClose />}
          </Button>
          <p className={styles.balance}>
            {t('send.balance')} {showBalance ? shannonToCKBFormatter(balance) : HIDE_BALANCE} CKB
          </p>
        </>
      )}
    </div>
  )
}

const Send = () => {
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      showWaitForFullySynced,
    },
    wallet: { id: walletID = '', balance = '', device },
    chain: { networkID, connectionStatus },
    settings: { networks = [] },
    consumeCells,
  } = useGlobalState()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const isMainnet = isMainnetUtil(networks, networkID)
  const consumeOutPoints = useMemo(() => consumeCells?.map(v => v.outPoint), [useMemo])
  const { enableUseSentCell, onChangeEnableUseSentCell } = useSendWithSentCell()

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
    updateIsSendMax,
  } = useInitialize({
    walletID,
    items: send.outputs,
    generatedTx: send.generatedTx,
    price: send.price,
    sending,
    isMainnet,
    enableUseSentCell,
    consumeOutPoints,
    dispatch,
    t,
  })

  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('isSendMax')) {
      updateIsSendMax(true)
    }
    // only when router change init send max
  }, [searchParams, updateIsSendMax])

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

  useOnTransactionChange({
    walletID,
    items: outputs,
    price: send.price,
    isMainnet,
    dispatch,
    isSendMax,
    setTotalAmount,
    setErrorMessage,
    t,
    consumeOutPoints,
    enableUseSentCell,
  })

  let errorMessageUnderTotal = errorMessage
  try {
    validateTotalAmount(
      totalAmount,
      fee,
      consumeCells
        ? consumeCells.reduce((total, addr) => total + BigInt(addr.capacity || 0), BigInt(0)).toString()
        : balance
    )
  } catch (err) {
    if (isErrorWithI18n(err)) {
      errorMessageUnderTotal = t(err.message)
    }
  }

  const disabled =
    connectionStatus === 'offline' ||
    sending ||
    !!errorMessageUnderTotal ||
    !send.generatedTx ||
    outputs.some(v => !v.address)

  const outputErrors = useOutputErrors(outputs, isMainnet, isSendMax)

  const isMaxBtnDisabled = (() => {
    try {
      validateOutputs(outputs.slice(0, -1), isMainnet)
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

  useEffect(() => {
    return () => {
      dispatch({
        type: AppActions.UpdateConsumeCells,
      })
    }
  }, [])

  return (
    <PageContainer head={<SendHeader balance={balance} useConsumeCell={!!consumeCells?.length} />}>
      <form onSubmit={handleSubmit} data-wallet-id={walletID} data-status={disabled ? 'not-ready' : 'ready'}>
        <div className={`${styles.layout} ${showWaitForFullySynced ? styles.withFullySynced : ''}`}>
          <div className={styles.left}>
            <div className={styles.content}>
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
                      isMainnet={isMainnet}
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
            <div className={styles.content}>
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
              <label htmlFor="send-with-sent-cell" className={styles.allowUseSent}>
                <input
                  type="checkbox"
                  id="send-with-sent-cell"
                  checked={enableUseSentCell}
                  onChange={onChangeEnableUseSentCell}
                />
                <span>{t('send.allow-use-sent-cell')}</span>
              </label>
              <div className={styles.actions}>
                <Button type="reset" onClick={handleClear} label={t('send.reset')} />
                <Button type="submit" disabled={disabled} label={t('send.send')}>
                  {sending ? <Spinner /> : (t(enableUseSentCell ? 'send.submit-transaction' : 'send.send') as string)}
                </Button>
              </div>
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
    </PageContainer>
  )
}

Send.displayName = 'Send'

export default Send
