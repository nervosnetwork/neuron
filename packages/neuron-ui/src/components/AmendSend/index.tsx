import React, { useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useState as useGlobalState, useDispatch, appState, AppActions } from 'states'
import TextField from 'widgets/TextField'
import PageContainer from 'components/PageContainer'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { GoBack } from 'widgets/Icons/icon'
import { MIN_AMOUNT } from 'utils/const'
import {
  isMainnet as isMainnetUtil,
  localNumberFormatter,
  useGoBack,
  scriptToAddress,
  shannonToCKBFormatter,
  RoutePath,
  isSecp256k1Address,
} from 'utils'
import AlertDialog from 'widgets/AlertDialog'
import styles from './amendSend.module.scss'
import { useInitialize } from './hooks'

const AmendSend = () => {
  const {
    app: {
      send = appState.send,
      loadings: { sending = false },
      showWaitForFullySynced,
    },
    wallet: { id: walletID = '', addresses },
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { hash = '' } = useParams()

  const onBack = useGoBack()

  const isMainnet = isMainnetUtil(networks, networkID)

  const { fee, updateTransactionPrice, onDescriptionChange, transaction, onSubmit, minPrice, isConfirmedAlertShown } =
    useInitialize({
      hash,
      walletID,
      price: send.price,
      isMainnet,
      dispatch,
      t,
    })

  const priceError = useMemo(() => {
    return Number(send.price) < Number(minPrice) ? t('price-switch.errorTip', { minPrice }) : null
  }, [send.price, minPrice])

  const inputHint = t('price-switch.hintTip', { suggestFeeRate: minPrice })

  const handlePriceChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value: inputValue } = e.currentTarget

      updateTransactionPrice(inputValue.replace(/,/g, ''))
    },
    [updateTransactionPrice]
  )

  const getLastOutputAddress = (outputs: State.DetailedOutput[]) => {
    if (outputs.length === 1) {
      return scriptToAddress(outputs[0].lock, { isMainnet })
    }

    const change = outputs.find(output => {
      const address = scriptToAddress(output.lock, { isMainnet })
      if (!isSecp256k1Address(address)) {
        navigate(`${RoutePath.History}/amendSUDTSend/${hash}`, {
          replace: true,
        })
      }

      return !!addresses.find(item => item.address === address && item.type === 1)
    })
    if (change) {
      return scriptToAddress(change.lock, { isMainnet })
    }

    const receive = outputs.find(output => {
      const address = scriptToAddress(output.lock, { isMainnet })
      return !!addresses.find(item => item.address === address && item.type === 0)
    })
    if (receive) {
      return scriptToAddress(receive.lock, { isMainnet })
    }

    return ''
  }

  const inputsCapacity = useMemo(() => {
    if (transaction) {
      return transaction.inputs.reduce((total, cur) => {
        return total + BigInt(cur.capacity || '0')
      }, BigInt(0))
    }
    return undefined
  }, [transaction])

  const items: {
    address: string
    amount: string
    capacity: string
    isLastOutput: boolean
    output: State.DetailedOutput
  }[] = useMemo(() => {
    if (transaction && transaction.outputs.length && inputsCapacity) {
      const lastOutputAddress = getLastOutputAddress(transaction.outputs)
      return transaction.outputs.map(output => {
        const address = scriptToAddress(output.lock, { isMainnet })
        const capacity =
          transaction.outputs.length === 1 && address === lastOutputAddress
            ? (inputsCapacity - fee).toString()
            : output.capacity
        return {
          capacity,
          address,
          output,
          amount: shannonToCKBFormatter(capacity || '0'),
          isLastOutput: address === lastOutputAddress,
        }
      })
    }
    return []
  }, [transaction?.outputs, inputsCapacity, fee])

  const outputsCapacity = useMemo(() => {
    const outputList = items.length === 1 ? items : items.filter(item => !item.isLastOutput)
    return outputList.reduce((total, cur) => {
      return total + BigInt(cur.capacity || '0')
    }, BigInt(0))
  }, [items])

  const totalAmount = shannonToCKBFormatter(outputsCapacity.toString())

  const lastOutputsCapacity = useMemo(() => {
    if (inputsCapacity) {
      if (items.length === 1) {
        return BigInt(items[0].capacity || '0')
      }

      return inputsCapacity - outputsCapacity - fee
    }
    return undefined
  }, [inputsCapacity, fee, outputsCapacity, items])

  useEffect(() => {
    if (transaction && lastOutputsCapacity !== undefined) {
      const outputs = items.map(item => {
        const capacity = item.isLastOutput ? lastOutputsCapacity.toString() : item.capacity
        return {
          ...item.output,
          capacity,
        }
      })
      dispatch({
        type: AppActions.UpdateGeneratedTx,
        payload: {
          ...transaction,
          outputs,
        },
      })
    }
  }, [lastOutputsCapacity, transaction, items, dispatch])

  const disabled =
    sending || !send.generatedTx || priceError || lastOutputsCapacity === undefined || lastOutputsCapacity < MIN_AMOUNT

  return (
    <PageContainer
      head={
        <div className={styles.headerContainer}>
          <GoBack className={styles.goBack} onClick={onBack} />
          <p>{t('navbar.send')}</p>
        </div>
      }
    >
      <form onSubmit={onSubmit} data-wallet-id={walletID} data-status={disabled ? 'not-ready' : 'ready'}>
        <div className={`${styles.layout} ${showWaitForFullySynced ? styles.withFullySynced : ''}`}>
          <div className={styles.left}>
            <div className={styles.content}>
              {items
                .filter(item => items.length === 1 || !item.isLastOutput)
                .map(item => (
                  <div className={styles.inputCell}>
                    <div className={styles.addressCell}>
                      <div className={styles.label}>{t('send.address')}</div>
                      <div className={styles.content}>{item.address}</div>
                    </div>

                    <TextField
                      className={styles.textFieldClass}
                      label={t('send.amount')}
                      field="amount"
                      value={item.amount ? localNumberFormatter(item.amount) : ''}
                      disabled
                      width="100%"
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.content}>
              <div className={styles.totalAmountField}>
                <p className={styles.title}>{t('send.total-amount')}</p>
                <p className={styles.value}>{totalAmount}</p>
              </div>
              <TextField
                placeholder={t('send.description-optional')}
                className={styles.textFieldClass}
                field="description"
                label={t('send.description')}
                value={send.description}
                disabled={sending}
                onChange={onDescriptionChange}
                width="100%"
              />
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
                value={localNumberFormatter(send.price)}
                onChange={handlePriceChange}
                suffix="shannons/kB"
                error={priceError}
                hint={!priceError && inputHint ? inputHint : null}
                width="100%"
              />
            </div>
            <div className={styles.rightFooter}>
              <label htmlFor="send-with-sent-cell" className={styles.allowUseSent}>
                <input type="checkbox" id="send-with-sent-cell" checked />
                <span>{t('send.allow-use-sent-cell')}</span>
              </label>
              <div className={styles.actions}>
                <Button type="submit" disabled={!!disabled} label={t('send.send')}>
                  {sending ? <Spinner /> : (t('send.submit-transaction') as string)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <AlertDialog
        show={isConfirmedAlertShown}
        title={t('send.transaction-confirmed')}
        message={t('send.transaction-cannot-amend')}
        type="warning"
        onOk={onBack}
        action="ok"
      />
    </PageContainer>
  )
}

AmendSend.displayName = 'AmendSend'

export default AmendSend
