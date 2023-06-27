import React, { useState, useCallback, useReducer, useMemo, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUDTAccount } from 'components/SUDTAccountList'
import TransactionFeePanel from 'components/TransactionFeePanel'
import PageContainer from 'components/PageContainer'
import SUDTAvatar from 'widgets/SUDTAvatar'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import Button from 'widgets/Button'
import Tooltip from 'widgets/Tooltip'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import RadioGroup from 'widgets/RadioGroup'
import { ReactComponent as Experiment } from 'widgets/Icons/Experiment.svg'
import { ReactComponent as EyesOpen } from 'widgets/Icons/EyesOpen.svg'
import { ReactComponent as EyesClose } from 'widgets/Icons/EyesClose.svg'
import { ReactComponent as AttentionOutline } from 'widgets/Icons/AttentionOutline.svg'
import { getSUDTAccount } from 'services/remote'
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
import { getDisplayName, getDisplaySymbol } from 'components/UANDisplay'
import {
  AddressLockType,
  SendType,
  getGenerator,
  useAddressLockType,
  useOnSumbit,
  useOptions,
  useSendType,
} from './hooks'
import styles from './sUDTSend.module.scss'

const { INIT_SEND_PRICE, DEFAULT_SUDT_FIELDS, HIDE_BALANCE } = CONSTANTS

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

const reducer: React.Reducer<typeof initState, { type: Fields | 'reset'; payload: string | boolean }> = (
  state,
  action
) => {
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
    case 'reset': {
      return { ...initState }
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
  const [showBalance, setShowBalance] = useState(true)

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

  const breakcrum = [
    { label: t('navbar.s-udt'), link: RoutePath.SUDTAccountList },
    { label: t('s-udt.send.title'), link: RoutePath.SUDTSend },
  ]

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    (value: string) => {
      const price = value.split('.')[0].replace(/[^\d]/, '')
      dispatch({ type: Fields.Price, payload: price })
    },
    [dispatch]
  )

  const onSubmit = useOnSumbit({ isSubmittable, accountType, walletId, addressLockType, sendType })

  const [displaySymbol, displayTokenName] = useMemo(
    () => [
      getDisplaySymbol(accountInfo?.tokenName || '', accountInfo?.symbol || ''),
      getDisplayName(accountInfo?.tokenName || DEFAULT_SUDT_FIELDS.tokenName, accountInfo?.symbol || ''),
    ],
    [accountInfo]
  )

  const balance = useMemo(
    () => (accountInfo ? sudtValueToAmount(accountInfo.balance, accountInfo.decimal) : '--'),
    [accountInfo]
  )

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <Spinner size={SpinnerSize.large} />
      </div>
    )
  }

  return (
    <PageContainer
      head={
        <div className={styles.pageHeader}>
          <Experiment />
          <Breadcrum pages={breakcrum} />
        </div>
      }
    >
      <form onSubmit={onSubmit}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className={styles.info}>
              <SUDTAvatar type="logo" />
              <div>
                <div className={styles.accountName}>{accountInfo?.accountName}</div>
                <div className={styles.tokenName}>{displayTokenName}</div>
                <div className={styles.balance}>
                  {showBalance ? balance : HIDE_BALANCE} {displaySymbol}
                  <Button className={styles.btn} type="text" onClick={() => setShowBalance(prev => !prev)}>
                    {showBalance ? <EyesOpen /> : <EyesClose />}
                  </Button>
                </div>
              </div>
            </div>
            <div className={styles.sendContainer}>
              {fields.map(field => {
                return (
                  <>
                    <TextField
                      label={field.key === Fields.Amount ? `${field.label} (${displaySymbol})` : field.label}
                      value={
                        field.key === Fields.Amount ? localNumberFormatter(sendState[field.key]) : sendState[field.key]
                      }
                      key={field.label}
                      field={field.key}
                      onChange={onInput}
                      rows={field.key === Fields.Address ? 2 : 1}
                      suffix={
                        field.key === Fields.Amount ? (
                          <Button
                            disabled={!sendState.address || !!errors.address}
                            type="text"
                            onClick={onToggleSendingAll}
                            className={styles.max}
                          >
                            Max
                          </Button>
                        ) : null
                      }
                      disabled={sendState.sendAll}
                      error={errors[field.key]}
                      className={styles[field.key]}
                    />

                    {field.key === Fields.Address && options?.length ? (
                      <>
                        <RadioGroup
                          defaultValue={sendType}
                          onChange={onChangeSendType}
                          itemClassName={styles.optionItem}
                          options={options.map(item => ({
                            value: item.key,
                            label: t(`s-udt.send.${item.label}`, item?.params),
                            suffix: item.tooltip ? (
                              <div className={styles.tipItem}>
                                <Tooltip
                                  tip={
                                    <p className={styles.tooltip}>{t(`s-udt.send.${item.tooltip}`, item?.params)}</p>
                                  }
                                  showTriangle
                                >
                                  <AttentionOutline className={styles.attention} />
                                </Tooltip>
                              </div>
                            ) : null,
                            tip:
                              item.key === SendType.secp256Cheque && !isMainnet ? (
                                <div className={styles.selectError}>{t('messages.light-client-cheque-warning')}</div>
                              ) : null,
                          }))}
                        />
                        {!isOptionCorrect ? (
                          <div className={styles.selectError}>{t('s-udt.send.select-option')}</div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                )
              })}
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.rightContent}>
              <div className={styles.description}>
                <TextField
                  label={t('s-udt.send.description')}
                  value={sendState.description}
                  field={Fields.Description}
                  onChange={onInput}
                  error={remoteError}
                />
              </div>
              <div className={styles.fee}>
                <TransactionFeePanel fee={fee} price={sendState.price} onPriceChange={onPriceChange} />
              </div>
            </div>
            <div className={styles.rightFooter}>
              <Button type="reset" onClick={() => dispatch({ type: 'reset', payload: true })} label={t('send.reset')} />
              <Button type="submit" label={t('s-udt.send.submit')} onClick={onSubmit} disabled={!isSubmittable} />
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}

SUDTSend.displayName = 'SUDTSend'

export default SUDTSend
