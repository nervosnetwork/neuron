import React, { useState, useCallback, useReducer, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SpinnerSize } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { SUDTAccount } from 'components/SUDTAccountList'
import TransactionFeePanel from 'components/TransactionFeePanel'
import SUDTAvatar from 'widgets/SUDTAvatar'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import Button from 'widgets/Button'
import Spinner from 'widgets/Spinner'
import { ReactComponent as TooltipIcon } from 'widgets/Icons/Tooltip.svg'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { getSUDTAccount, destoryAssetAccount } from 'services/remote'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import {
  validateAssetAccountAddress as validateAddress,
  validateAssetAccountAmount as validateAmount,
  isMainnet as isMainnetUtil,
  shannonToCKBFormatter,
  sudtValueToAmount,
  sudtAmountToValue,
  localNumberFormatter,
  RoutePath,
  AccountType,
  isSuccessResponse,
  validateAmountRange,
  CONSTANTS,
} from 'utils'
import { AmountNotEnoughException, isErrorWithI18n } from 'exceptions'
import { UANTokenName, UANTonkenSymbol } from 'components/UANDisplay'
import { AddressLockType, getGenerator, useAddressLockType, useOnSumbit, useOptions, useSendType } from './hooks'
import styles from './sUDTSend.module.scss'

const { INIT_SEND_PRICE, DEFAULT_SUDT_FIELDS } = CONSTANTS

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
      return { ...state, [Fields.Amount]: action.payload.toString().replace(/,/g, '') }
    }
    case Fields.SendAll: {
      return { ...state, [Fields.SendAll]: !!action.payload }
    }
    case Fields.Price: {
      return { ...state, [Fields.Price]: action.payload.toString().replace(/,/g, '') }
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

  const isMainnet = isMainnetUtil(networks, networkID)
  const addressLockType = useAddressLockType(sendState.address, isMainnet)
  const isSecp256k1Addr = addressLockType === AddressLockType.secp256

  const [accountInfo, setAccountInfo] = useState<Pick<
    Required<SUDTAccount>,
    'accountId' | 'accountName' | 'tokenName' | 'balance' | 'tokenId' | 'decimal' | 'symbol'
  > | null>(null)
  const accountType = accountInfo?.tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId ? AccountType.CKB : AccountType.SUDT
  const { sendType, onChange: onChangeSendType } = useSendType({ addressLockType, accountType })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fee = experimental?.tx?.fee ? `${shannonToCKBFormatter(experimental.tx.fee)}` : '0'

  useEffect(() => {
    if (accountId && walletId) {
      getSUDTAccount({ walletID: walletId, id: accountId })
        .then(res => {
          if (isSuccessResponse(res)) {
            const account: Controller.GetSUDTAccount.Response = res.result
            if (!account.decimal) {
              throw new Error('Decimal is undefiend')
            }
            setAccountInfo({
              accountId: `${account.id ?? ''}`,
              accountName: account.accountName || DEFAULT_SUDT_FIELDS.accountName,
              tokenName: account.tokenName || DEFAULT_SUDT_FIELDS.tokenName,
              balance: account.balance,
              tokenId: account.tokenID,
              decimal: account.decimal,
              symbol: account.symbol || DEFAULT_SUDT_FIELDS.symbol,
            })
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

  const breakcrum = [{ label: t('navbar.s-udt'), link: RoutePath.SUDTAccountList }]
  const fields: { key: Fields.Address | Fields.Amount; label: string }[] = [
    { key: Fields.Address, label: t('s-udt.send.address') },
    { key: Fields.Amount, label: t('s-udt.send.amount') },
  ]

  const errors: { [Fields.Address]: string; [Fields.Amount]: string } = useMemo(() => {
    const errMap = { address: '', amount: '' }
    try {
      validateAddress({ address: sendState.address, isMainnet, required: false })
    } catch (err) {
      if (isErrorWithI18n(err)) {
        errMap.address = t(err.message, err.i18n)
      }
    }
    try {
      validateAmount({ amount: sendState.amount, decimal: accountInfo?.decimal ?? '32', required: false })
      const value = sudtAmountToValue(sendState.amount, accountInfo?.decimal ?? '32')
      const total = accountInfo?.balance ?? '0'
      if (total && value && BigInt(total) < BigInt(value)) {
        throw new AmountNotEnoughException()
      }
      if (sendState.amount && isSecp256k1Addr && accountType === AccountType.CKB) {
        validateAmountRange(sendState.amount)
      }
    } catch (err) {
      if (isErrorWithI18n(err)) {
        errMap.amount = t(err.message, err.i18n)
      }
    }
    return errMap
  }, [sendState.address, sendState.amount, isMainnet, accountInfo, t, accountType, isSecp256k1Addr])

  const isFormReady =
    !isSending &&
    Object.values(errors).every(v => !v) &&
    [Fields.Address, Fields.Amount].every(key => sendState[key as Fields.Address | Fields.Amount].trim())
  const options = useOptions({
    address: sendState.address,
    addressLockType,
    accountInfo,
    isAddressCorrect: !errors.address,
  })
  const isOptionCorrect = !!(!options?.length || sendType)
  const isSubmittable = isFormReady && experimental?.tx && !remoteError && isOptionCorrect
  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    clearTimer()

    if (!accountInfo || !isOptionCorrect) {
      return clearTimer
    }
    const amount = sudtAmountToValue(sendState.amount, accountInfo?.decimal)
    if (amount === undefined) {
      return clearTimer
    }
    if (sendState.sendAll) {
      if (!sendState.address || errors.address) {
        return clearTimer
      }
    } else if (
      [Fields.Address, Fields.Amount].some(key => !sendState[key as Fields.Address | Fields.Amount].trim()) ||
      Object.values(errors).some(v => v)
    ) {
      return clearTimer
    }
    globalDispatch({ type: AppActions.UpdateExperimentalParams, payload: null })

    const TIMER_DELAY = 300
    timerRef.current = setTimeout(() => {
      const params = {
        assetAccountID: accountInfo?.accountId,
        walletID: walletId,
        address: sendState.address,
        amount: sendState.sendAll ? 'all' : amount,
        feeRate: sendState.price,
        description: sendState.description,
      }
      const generator = getGenerator(sendType)
      generator(params)
        .then(res => {
          if (isSuccessResponse(res)) {
            globalDispatch({ type: AppActions.UpdateExperimentalParams, payload: { tx: res.result } })
            return
          }
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        })
        .catch((err: Error) => {
          setRemoteError(err.message)
        })
    }, TIMER_DELAY)
    return clearTimer
    // eslint-disable-next-line
  }, [
    walletId,
    sendState.address,
    sendState.amount,
    sendState.sendAll,
    sendState.description,
    sendState.price,
    errors,
    globalDispatch,
    setRemoteError,
    accountInfo,
    timerRef,
    sendType,
    isOptionCorrect,
  ])

  useEffect(() => {
    const amount = experimental?.tx?.anyoneCanPaySendAmount
    if (sendState.sendAll && amount && accountInfo?.decimal) {
      dispatch({
        type: Fields.Amount,
        payload: sudtValueToAmount(amount, accountInfo.decimal),
      })
    }
  }, [sendState.sendAll, experimental, accountInfo])

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

  const [isDestroying, setIsDestroying] = useState(false)
  const onDestroy = useCallback(() => {
    setIsDestroying(true)
    destoryAssetAccount({ walletID: walletId, id: accountId! })
      .then(res => {
        if (isSuccessResponse(res)) {
          const tx = res.result
          globalDispatch({ type: AppActions.UpdateExperimentalParams, payload: { tx } })
          globalDispatch({
            type: AppActions.RequestPassword,
            payload: {
              walletID: walletId,
              actionType: 'destroy-asset-account',
            },
          })
        } else {
          globalDispatch({
            type: AppActions.AddNotification,
            payload: {
              type: 'alert',
              timestamp: +new Date(),
              content: typeof res.message === 'string' ? res.message : res.message.content!,
            },
          })
        }
      })
      .finally(() => {
        setIsDestroying(false)
      })
  }, [globalDispatch, walletId, accountId])

  const showDestory = useMemo(
    () => accountId && (accountType === AccountType.CKB || BigInt(accountInfo?.balance || 0) === BigInt(0)),
    [accountType, accountInfo, accountId]
  )
  const onSubmit = useOnSumbit({ isSubmittable, accountType, walletId, addressLockType, sendType })

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <Spinner size={SpinnerSize.large} />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.breadcrum}>
        <Breadcrum pages={breakcrum} />
      </div>
      <div className={styles.title}>{t('s-udt.send.title')}</div>
      <form onSubmit={onSubmit}>
        <div className={styles.cardContainer}>
          <div className={styles.info}>
            <div className={styles.avatar}>
              <SUDTAvatar name={accountInfo?.accountName} />
            </div>
            <div className={styles.accountName}>{accountInfo?.accountName}</div>
            <div className={styles.tokenNameContainer}>
              <UANTokenName
                name={accountInfo?.tokenName || DEFAULT_SUDT_FIELDS.tokenName}
                symbol={accountInfo?.symbol || ''}
                className={styles.tokenName}
              />
            </div>
            <div className={styles.balance}>
              {accountInfo ? sudtValueToAmount(accountInfo.balance, accountInfo.decimal) : '--'}
            </div>
            <div className={styles.symbolConatiner}>
              <UANTonkenSymbol
                name={accountInfo?.tokenName || ''}
                symbol={accountInfo?.symbol || ''}
                className={styles.symbol}
              />
            </div>
          </div>
          <div className={styles.sendContainer}>
            {fields.map(field => {
              return (
                <TextField
                  label={field.label}
                  value={
                    field.key === Fields.Amount ? localNumberFormatter(sendState[field.key]) : sendState[field.key]
                  }
                  key={field.label}
                  required
                  field={field.key}
                  onChange={onInput}
                  suffix={
                    field.key === Fields.Amount ? (
                      <UANTonkenSymbol
                        name={accountInfo?.tokenName || ''}
                        symbol={accountInfo?.symbol || ''}
                        className={styles.symbol}
                      />
                    ) : null
                  }
                  disabled={sendState.sendAll}
                  error={errors[field.key]}
                  className={styles[field.key]}
                />
              )
            })}
            {options?.length &&
              options.map(v => (
                <div className={`${styles[v.key]} ${styles.option}`} key={v.key}>
                  <input
                    type={options?.length > 1 ? 'radio' : 'checkbox'}
                    id={v.key}
                    checked={v.key === sendType}
                    onChange={onChangeSendType}
                  />
                  <label htmlFor={v.key}>{t(`s-udt.send.${v.label}`, v?.params)}</label>
                  {v.tooltip ? (
                    <span className={styles.optionTooltip} data-tooltip={t(`s-udt.send.${v.tooltip}`, v?.params)}>
                      <TooltipIcon width={12} height={12} />
                    </span>
                  ) : null}
                </div>
              ))}
            {!isOptionCorrect && <div className={styles.selectError}>{t('s-udt.send.select-option')}</div>}
            <div className={styles.sendAll}>
              <Button
                type="primary"
                label="Max"
                onClick={onToggleSendingAll}
                disabled={!sendState.address || !!errors.address}
              />
            </div>
            <div className={styles.fee}>
              <TransactionFeePanel fee={fee} price={sendState.price} onPriceChange={onPriceChange} />
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
            <div className={styles.remoteError}>
              {remoteError ? (
                <>
                  <Attention />
                  {remoteError}
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className={showDestory ? styles['ckb-footer'] : styles.footer}>
          {showDestory ? (
            <div className={styles.tooltip}>
              <Button type="cancel" label="" onClick={onDestroy} disabled={isDestroying}>
                {t('s-udt.send.destroy') as string}
              </Button>
              <span className={styles.tooltiptext}>
                {t(accountType === AccountType.CKB ? 's-udt.send.destroy-ckb-desc' : 's-udt.send.destroy-sudt-desc')}
              </span>
            </div>
          ) : null}
          <Button type="submit" label={t('s-udt.send.submit')} onClick={onSubmit} disabled={!isSubmittable} />
        </div>
      </form>
    </div>
  )
}

SUDTSend.displayName = 'SUDTSend'

export default SUDTSend
