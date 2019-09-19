import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { calculateCycles } from 'services/remote/wallets'

import { outputsToTotalAmount, priceToFee } from 'utils/formatters'
import { verifyAddress, verifyAmount, verifyAmountRange, verifyTransactionOutputs } from 'utils/validators'
import { ErrorCode } from 'utils/const'
import { MAX_DECIMAL_DIGITS } from '../../utils/const'
import { TransactionOutput } from '.'

let cyclesTimer: ReturnType<typeof setTimeout>

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
  dispatch: StateDispatch,
  setIsTransactionValid: Function,
  setTotalAmount: Function
) => {
  useEffect(() => {
    clearTimeout(cyclesTimer)
    cyclesTimer = setTimeout(() => {
      if (verifyTransactionOutputs(items)) {
        setIsTransactionValid(true)
        const totalAmount = outputsToTotalAmount(items)
        setTotalAmount(totalAmount)
        calculateCycles({
          walletID,
          capacities: totalAmount,
        })
          .then(response => {
            if (response.status) {
              if (Number.isNaN(+response.result)) {
                throw new Error('Invalid Cycles')
              }
              dispatch({
                type: AppActions.UpdateSendCycles,
                payload: response.result,
              })
            } else {
              throw new Error('Cycles Not Calculated')
            }
          })
          .catch(() => {
            dispatch({
              type: AppActions.UpdateSendCycles,
              payload: '0',
            })
          })
      } else {
        setIsTransactionValid(false)
        dispatch({
          type: AppActions.UpdateSendCycles,
          payload: '0',
        })
      }
    }, 300)
  }, [walletID, items, dispatch, setIsTransactionValid, setTotalAmount])
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
  items: TransactionOutput[],
  price: string,
  cycles: string,
  dispatch: React.Dispatch<any>,
  t: any
) => {
  const fee = useMemo(() => priceToFee(price, cycles), [price, cycles]) // in shannon
  const [isTransactionValid, setIsTransactionValid] = useState(false)
  const [totalAmount, setTotalAmount] = useState('0')

  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const addTransactionOutput = useAddTransactionOutput(dispatch)
  const removeTransactionOutput = useRemoveTransactionOutput(dispatch)
  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)
  const onSubmit = useOnSubmit(items, dispatch)
  const onClear = useClear(dispatch)

  const onGetAddressErrorMessage = useCallback(
    (addr: string) => {
      if (addr === '') {
        return t(`messages.codes.${ErrorCode.AddressIsEmpty}`)
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
    fee,
    totalAmount,
    setTotalAmount,
    isTransactionValid,
    setIsTransactionValid,
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
  }
}

export default {
  useInitialize,
}
