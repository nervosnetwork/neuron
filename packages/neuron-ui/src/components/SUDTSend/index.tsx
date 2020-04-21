import React, { useState, useCallback, useReducer, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { SpinnerSize } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import SUDTAvatar from 'widgets/SUDTAvatar'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { useState as useGlobalState, useDispatch } from 'states/stateProvider'
import { AppActions } from 'states/stateProvider/reducer'
import isMainnetUtil from 'utils/isMainnet'
import { verifySUDTAddress, verifySUDTAmount } from 'utils/validators'
import TransactionFeePanel from 'components/TransactionFeePanel'
import { shannonToCKBFormatter, sudtValueToAmount, sudtAmountToValue } from 'utils/formatters'
import { INIT_SEND_PRICE, Routes, DEFAULT_SUDT_FIELDS, MEDIUM_FEE_RATE } from 'utils/const'
import {
  getSUDTAccount,
  generateSUDTTransaction,
  generateSendAllSUDTTransaction,
  getAnyoneCanPayScript,
} from 'services/remote'
import { SUDTAccount } from 'components/SUDTAccountList'
import styles from './sUDTSend.module.scss'

enum Fields {
  Address = 'address',
  Amount = 'amount',
  Price = 'price',
  Description = 'description',
  SendAll = 'sendAll',
}

const initState = {
  [Fields.Address]: '',
  [Fields.Amount]: '',
  [Fields.Price]: INIT_SEND_PRICE,
  [Fields.SendAll]: false,
  [Fields.Description]: '',
}

const reducer: React.Reducer<typeof initState, { type: Fields; payload: string | boolean }> = (state, action) => {
  switch (action.type) {
    case Fields.Address: {
      return { ...state, [Fields.Address]: action.payload.toString() }
    }
    case Fields.Amount: {
      return { ...state, [Fields.Amount]: action.payload.toString() }
    }
    case Fields.SendAll: {
      return { ...state, [Fields.SendAll]: !!action.payload }
    }
    case Fields.Price: {
      return { ...state, [Fields.Price]: action.payload.toString() }
    }
    case Fields.Description: {
      return { ...state, [Fields.Description]: action.payload.toString() }
    }
    default: {
      return state
    }
  }
}

const SUDTSend = () => {
  const {
    wallet: { id: walletId },
    app: {
      loadings: { sending: isSending = false },
    },
    settings: { networks },
    chain: { networkID },
    experimental,
  } = useGlobalState()
  const globalDispatch = useDispatch()
  const [t] = useTranslation()
  const { accountId } = useParams<{ accountId: string }>()
  const [sendState, dispatch] = useReducer(reducer, initState)
  const [isLoaded, setIsLoaded] = useState(false)
  const [remoteError, setRemoteError] = useState('')
  const [anyoneCanPayScript, setAnyoneCanPayScript] = useState<Omit<Controller.GetScript.Response, 'cellDep'> | null>(
    null
  )

  const [accountInfo, setAccountInfo] = useState<Pick<
    Required<SUDTAccount>,
    'accountId' | 'accountName' | 'tokenName' | 'balance' | 'tokenId' | 'decimal' | 'symbol'
  > | null>(null)

  const isMainnet = isMainnetUtil(networks, networkID)

  useEffect(() => {
    if (accountId && walletId) {
      getSUDTAccount({ walletID: walletId, id: accountId })
        .then(res => {
          if (res.status === 1) {
            const account: Controller.GetSUDTAccount.Response = res.result
            setAccountInfo({
              accountId: `${account.id!}`,
              accountName: account.accountName || DEFAULT_SUDT_FIELDS.accountName,
              tokenName: account.tokenName || DEFAULT_SUDT_FIELDS.tokenName,
              balance: account.balance,
              tokenId: account.tokenID,
              decimal: account.decimal || '0',
              symbol: account.symbol || DEFAULT_SUDT_FIELDS.symbol,
            })
            // success
            return true
          }
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        })
        .catch((err: Error) => {
          console.error(err)

          return false
        })
        .finally(() => {
          setIsLoaded(true)
        })
    }
  }, [walletId, accountId, setIsLoaded])
  useEffect(() => {
    getAnyoneCanPayScript().then(res => {
      if (res.status === 1) {
        setAnyoneCanPayScript({
          codeHash: res.result.codeHash,
          hashType: res.result.hashType,
        })
      }
    })
  }, [])

  const breakcrum = [{ label: t('navbar.s-udt'), link: Routes.SUDTAccountList }]
  const fields: { key: Fields.Address | Fields.Amount; label: string }[] = [
    { key: Fields.Address, label: t('s-udt.send.address') },
    { key: Fields.Amount, label: t('s-udt.send.amount') },
  ]

  const errors: { [Fields.Address]: string; [Fields.Amount]: string } = useMemo(() => {
    const addressError =
      sendState.address && !verifySUDTAddress(sendState.address, anyoneCanPayScript?.codeHash ?? '', isMainnet)
        ? 'invalid address'
        : ''

    let amountError =
      sendState.amount && verifySUDTAmount(sendState.amount, accountInfo?.decimal || '0') !== true
        ? 'invalid amount'
        : ''
    if (!amountError) {
      try {
        const value = sudtAmountToValue(sendState.amount, accountInfo?.decimal || '0')
        const total = sudtAmountToValue(accountInfo?.balance || '0', accountInfo?.decimal || '0')
        if (value !== undefined && total !== undefined && BigInt(value) > BigInt(total)) {
          amountError = 'not enough'
        }
      } catch {
        // ignore
      }
    }
    return {
      address: addressError,
      amount: amountError,
    }
  }, [sendState.address, sendState.amount, isMainnet, anyoneCanPayScript, accountInfo])

  // isSubmittable => ready for password
  const isSubmittable = (!isSending && [Fields.Address, Fields.Amount].every(key => sendState[key])) || experimental?.tx
  Object.values(errors).every(v => !v)

  useEffect(() => {
    if (!accountInfo) {
      return
    }
    const amount = sudtAmountToValue(sendState.amount, accountInfo?.decimal)
    if (amount === undefined) {
      return
    }
    const params = {
      walletID: 'id',
      address: sendState.address,
      amount,
      feeRate: MEDIUM_FEE_RATE.toString(),
      description: sendState.description,
    }
    globalDispatch({
      type: AppActions.UpdateExperimentalParams,
      payload: null,
    })
    const generator = sendState.sendAll ? generateSendAllSUDTTransaction : generateSUDTTransaction
    generator(params)
      .then(res => {
        if (res.status === 1) {
          // TODO: set the fee
          globalDispatch({
            type: AppActions.UpdateExperimentalParams,
            payload: { tx: res.result },
          })
          return
        }
        throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
      })
      .catch((err: Error) => {
        setRemoteError(err.message)
      })
  }, [
    sendState.address,
    sendState.amount,
    sendState.description,
    sendState.sendAll,
    globalDispatch,
    setRemoteError,
    accountInfo,
  ])

  const onInput = useCallback(
    e => {
      const {
        dataset: { field },
        value,
      } = e.target as HTMLInputElement
      if (typeof field === 'string' && field in initState) {
        dispatch({ type: field as Fields, payload: value })
        setRemoteError('')
      }
    },
    [dispatch, setRemoteError]
  )

  const onToggleSendingAll = useCallback(() => {
    dispatch({ type: Fields.SendAll, payload: !sendState.sendAll })
  }, [dispatch, sendState.sendAll])

  const onPriceChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      const price = value.split('.')[0].replace(/[^\d]/, '')
      dispatch({ type: Fields.Price, payload: price })
    },
    [dispatch]
  )

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSubmittable) {
        globalDispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            actionType: 'send-sudt',
          },
        })
      }
    },
    [isSubmittable, globalDispatch, walletId]
  )

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <Spinner size={SpinnerSize.large} />
      </div>
    )
  }

  console.info(remoteError)

  return (
    <div className={styles.container}>
      <div className={styles.breadcrum}>
        <Breadcrum pages={breakcrum} />
      </div>
      <div className={styles.title}>Send</div>
      <form onSubmit={onSubmit}>
        <div className={styles.cardContainer}>
          <div className={styles.info}>
            <div className={styles.avatar}>
              <SUDTAvatar accountName={accountInfo?.accountName} />
            </div>
            <div className={styles.accountName}>{accountInfo?.accountName}</div>
            <div className={styles.tokenName}>{accountInfo?.tokenName}</div>
            <div className={styles.balance}>
              {accountInfo ? sudtValueToAmount(accountInfo.balance, accountInfo.decimal) : '--'}
            </div>
            <div className={styles.symbol}>{accountInfo?.symbol}</div>
          </div>
          <div className={styles.sendContainer}>
            {fields.map(field => {
              return (
                <TextField
                  label={field.label}
                  value={sendState[field.key]}
                  key={field.label}
                  required
                  field={field.key}
                  onChange={onInput}
                  suffix={field.key === Fields.Amount && accountInfo?.symbol}
                  disabled={sendState.sendAll}
                  error={errors[field.key]}
                  className={styles[field.key]}
                />
              )
            })}
            <div className={styles.sendAll}>
              <Button type="primary" label="Max" onClick={onToggleSendingAll} disabled={!sendState.address} />
            </div>
            <div className={styles.fee}>
              <TransactionFeePanel
                fee={shannonToCKBFormatter('100')} // todo
                price={sendState.price}
                onPriceChange={onPriceChange}
              />
            </div>
            <div className={styles.description}>
              <TextField
                label={t('s-udt.send.description')}
                value={sendState.description}
                field={Fields.Description}
                onChange={onInput}
                placeholder={t('s-udt.send.click-to-edit')}
                className={styles.descriptionField}
              />
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <Button type="submit" label="Submit" onClick={onSubmit} disabled={!isSubmittable} />
        </div>
      </form>
    </div>
  )
}

SUDTSend.displayName = 'SUDTSend'

export default SUDTSend
