import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { generateTx, generateSendingAllTx } from 'services/remote/wallets'

import { outputsToTotalAmount, CKBToShannonFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { verifyAddress, verifyAmount, verifyAmountRange, verifyTransactionOutputs } from 'utils/validators'
import { ErrorCode, MAX_DECIMAL_DIGITS } from 'utils/const'
import calculateFee from 'utils/calculateFee'

import { TransactionOutput } from '.'

let generateTxTimer: ReturnType<typeof setTimeout>

Object.defineProperty(generateTx, 'type', {
  value: 'common',
})
Object.defineProperty(generateSendingAllTx, 'type', {
  value: 'all',
})

const updateTransactionWith = (generator: typeof generateTx | typeof generateSendingAllTx) => ({
  walletID,
  price,
  items,
  setTotalAmount,
  setErrorMessage,
  updateTransactionOutput,
  dispatch,
}: {
  walletID: string
  price: string
  items: TransactionOutput[]
  setTotalAmount: Function
  setErrorMessage: Function
  updateTransactionOutput?: Function
  dispatch: StateDispatch
}) => {
  const { value: type } = Object.getOwnPropertyDescriptor(generator, 'type')!
  if (verifyTransactionOutputs(items, type === 'all')) {
    if (type === 'common') {
      const totalAmount = outputsToTotalAmount(items)
      setTotalAmount(totalAmount)
    }
    const realParams = {
      walletID,
      items: items.map(item => ({
        address: item.address,
        capacity: CKBToShannonFormatter(item.amount, item.unit),
      })),
      feeRate: price,
    }
    return generator(realParams)
      .then((res: any) => {
        if (res.status === 1) {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: res.result,
          })
          if (type === 'all') {
            const fmtItems = items.map((item, i) => ({
              ...item,
              amount: shannonToCKBFormatter(res.result.outputs[i].capacity, false, ''),
            }))
            const totalAmount = outputsToTotalAmount(fmtItems)
            setTotalAmount(totalAmount)
            if (updateTransactionOutput) {
              updateTransactionOutput('amount')(items.length - 1)(fmtItems[fmtItems.length - 1].amount)
            }
          }
          return res.result
        }
        throw new Error(res.message.content)
      })
      .catch((err: Error) => {
        dispatch({
          type: AppActions.UpdateGeneratedTx,
          payload: '',
        })
        setErrorMessage(err.message)
        return undefined
      })
  }
  dispatch({
    type: AppActions.UpdateGeneratedTx,
    payload: '',
  })
  return Promise.resolve(undefined)
}

const useUpdateTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: AppActions.UpdateSendOutput,
        payload: {
          idx,
          item: {
            [field]: value.replace(/\s/, ''),
          },
        },
      })
    },
    [dispatch]
  )

const useAddTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(() => {
    dispatch({
      type: AppActions.AddSendOutput,
      payload: null,
    })
  }, [dispatch])

const useRemoveTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (idx: number = -1) => {
      dispatch({
        type: AppActions.RemoveSendOutput,
        payload: idx,
      })
    },
    [dispatch]
  )

const useOnTransactionChange = (
  walletID: string,
  items: TransactionOutput[],
  price: string,
  dispatch: StateDispatch,
  isSendMax: boolean,
  setTotalAmount: Function,
  setErrorMessage: Function
) => {
  useEffect(() => {
    clearTimeout(generateTxTimer)
    setErrorMessage('')
    if (isSendMax) {
      return
    }
    generateTxTimer = setTimeout(() => {
      dispatch({
        type: AppActions.UpdateGeneratedTx,
        payload: null,
      })
      updateTransactionWith(generateTx)({
        walletID,
        items,
        price,
        setTotalAmount,
        setErrorMessage,
        dispatch,
      })
    }, 300)
  }, [walletID, items, price, isSendMax, dispatch, setTotalAmount, setErrorMessage])
}

const useOnSubmit = (items: TransactionOutput[], dispatch: StateDispatch) =>
  useCallback(
    (walletID: string = '') => () => {
      if (verifyTransactionOutputs(items)) {
        dispatch({
          type: AppActions.UpdateTransactionID,
          payload: null,
        })
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID,
            actionType: 'send',
          },
        })
      }
    },
    [dispatch, items]
  )

const useOnItemChange = (updateTransactionOutput: Function) =>
  useCallback(
    (e: any, value?: string) => {
      const { field = '', idx = -1 } = e.target.dataset
      if (undefined !== value) {
        if (field === 'amount') {
          if (Number.isNaN(+value) || /[^\d.]/.test(value) || +value < 0) {
            return
          }
          updateTransactionOutput(field)(idx)(value)
        } else {
          updateTransactionOutput(field)(idx)(value)
        }
      }
    },
    [updateTransactionOutput]
  )

const useUpdateTransactionPrice = (dispatch: StateDispatch) =>
  useCallback(
    (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        const price = value.replace(/[^\d]/g, '')
        dispatch({
          type: AppActions.UpdateSendPrice,
          payload: price,
        })
      }
    },
    [dispatch]
  )

const useSendDescriptionChange = (dispatch: StateDispatch) =>
  useCallback(
    (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        dispatch({
          type: AppActions.UpdateSendDescription,
          payload: value,
        })
      }
    },
    [dispatch]
  )

const clear = (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ClearSendState,
    payload: null,
  })
}

const useClear = (dispatch: StateDispatch) => useCallback(() => clear(dispatch), [dispatch])

export const useInitialize = (
  walletID: string,
  items: TransactionOutput[],
  generatedTx: any | null,
  price: string,
  sending: boolean,
  dispatch: React.Dispatch<any>,
  t: any
) => {
  const fee = useMemo(() => calculateFee(generatedTx), [generatedTx])

  const [totalAmount, setTotalAmount] = useState('0')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSendMax, setIsSendMax] = useState(false)

  const outputs = useMemo(() => items.map(item => ({ ...item, disabled: isSendMax || sending })), [
    items,
    isSendMax,
    sending,
  ])

  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const addTransactionOutput = useAddTransactionOutput(dispatch)
  const removeTransactionOutput = useRemoveTransactionOutput(dispatch)
  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)
  const onSubmit = useOnSubmit(items, dispatch)
  const onClear = useClear(dispatch)

  const updateSendingAllTransaction = useCallback(() => {
    updateTransactionWith(generateSendingAllTx)({
      walletID,
      items,
      price,
      setTotalAmount,
      setErrorMessage,
      updateTransactionOutput,
      dispatch,
    }).then(tx => {
      if (!tx) {
        setIsSendMax(false)
      }
    })
  }, [walletID, updateTransactionOutput, price, items, dispatch])

  const onSendMaxClick = useCallback(() => {
    if (!isSendMax) {
      setIsSendMax(true)
      updateSendingAllTransaction()
    } else {
      setIsSendMax(false)
      updateTransactionOutput('amount')(outputs.length - 1)('')
      const total = outputsToTotalAmount(items.filter(item => item.amount))
      setTotalAmount(total)
    }
  }, [updateSendingAllTransaction, setIsSendMax, isSendMax, outputs.length, updateTransactionOutput, items])

  useEffect(() => {
    if (isSendMax) {
      updateSendingAllTransaction()
    }
  }, [updateSendingAllTransaction, isSendMax, price])

  useEffect(() => {
    clear(dispatch)
  }, [walletID, dispatch])

  const onGetAddressErrorMessage: (isMainnet: boolean) => (addr: string) => string = useCallback(
    (isMainnet: boolean) => (addr: string) => {
      if (addr === '') {
        return t(`messages.codes.${ErrorCode.AddressIsEmpty}`)
      }
      if (isMainnet && !addr.startsWith('ckb')) {
        return t(`messages.mainnet-address-required`)
      }
      if (!isMainnet && !addr.startsWith('ckt')) {
        return t(`messages.testnet-address-required`)
      }
      if (!verifyAddress(addr)) {
        return t(`messages.codes.${ErrorCode.FieldInvalid}`, {
          fieldName: 'address',
          fieldValue: addr,
        })
      }
      return ''
    },
    [t]
  )

  const onGetAmountErrorMessage = useCallback(
    (text: string) => {
      const amount = text || '0'

      const msg = verifyAmount(amount)
      if (typeof msg === 'object') {
        return t(`messages.codes.${msg.code}`, {
          fieldName: 'amount',
          fieldValue: amount,
          length: MAX_DECIMAL_DIGITS,
        })
      }
      if (!verifyAmountRange(amount)) {
        return t(`messages.codes.${ErrorCode.AmountTooSmall}`, {
          amount,
        })
      }

      return undefined
    },
    [t]
  )

  return {
    outputs,
    fee,
    totalAmount,
    setTotalAmount,
    useOnTransactionChange,
    onItemChange,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onGetAddressErrorMessage,
    onGetAmountErrorMessage,
    onSubmit,
    onClear,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick,
  }
}

export default {
  useInitialize,
}
