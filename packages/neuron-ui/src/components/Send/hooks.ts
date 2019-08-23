import React, { useCallback, useEffect } from 'react'
import { IDropdownOption } from 'office-ui-fabric-react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { addNotification } from 'states/stateProvider/actionCreators'
import { calculateCycles } from 'services/remote/wallets'

import { MAX_DECIMAL_DIGITS, ErrorCode } from 'utils/const'
import { verifyAddress, verifyAmountRange } from 'utils/validators'
import { outputsToTotalCapacity } from 'utils/formatters'
import { TransactionOutput } from '.'

let cyclesTimer: ReturnType<typeof setTimeout>

const validateTransactionParams = ({
  items = [],
  dispatch,
}: {
  items: TransactionOutput[]
  dispatch?: StateDispatch
}) => {
  let errorMessage: State.Message<ErrorCode, { fieldName: string; fieldValue: string } | { amount: string }> | undefined

  const invalid = items.some(
    (item): boolean => {
      if (!item.address) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.AddressIsEmpty,
        }
        return true
      }
      const isAddressValid = verifyAddress(item.address)
      if (typeof isAddressValid === 'string') {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.FieldInvalid,
          meta: {
            fieldName: 'address',
            fieldValue: item.address,
          },
        }
        return true
      }
      if (Number.isNaN(+item.amount) || +item.amount < 0) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.NotNegative,
          meta: {
            fieldName: 'amount',
            fieldValue: item.amount || '0',
          },
        }
        return true
      }
      const [, decimal = ''] = item.amount.split('.')
      if (decimal.length > MAX_DECIMAL_DIGITS) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.DecimalExceed,
          meta: {
            fieldName: 'amount',
            fieldValue: item.amount,
          },
        }
        return true
      }
      if (!verifyAmountRange(item.amount)) {
        errorMessage = {
          type: 'warning',
          timestamp: +new Date(),
          code: ErrorCode.AmountTooSmall,
          meta: {
            amount: item.amount || '0',
          },
        }
        return true
      }
      return false
    }
  )
  if (invalid && errorMessage) {
    if (dispatch) {
      addNotification(errorMessage)(dispatch)
    }
    return false
  }
  return true
}

const useUpdateTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: AppActions.UpdateSendOutput,
        payload: {
          idx,
          item: {
            [field]: value.trim(),
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

const useOnTransactionChange = (walletID: string, items: TransactionOutput[], dispatch: StateDispatch) => {
  useEffect(() => {
    clearTimeout(cyclesTimer)
    cyclesTimer = setTimeout(() => {
      if (validateTransactionParams({ items })) {
        calculateCycles({
          walletID,
          capacities: outputsToTotalCapacity(items),
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
        dispatch({
          type: AppActions.UpdateSendCycles,
          payload: '0',
        })
      }
    }, 300)
  }, [walletID, items, dispatch])
}

const useOnSubmit = (items: TransactionOutput[], dispatch: StateDispatch) =>
  useCallback(
    (walletID: string = '') => () => {
      if (validateTransactionParams({ items, dispatch })) {
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
    (field: string = '', idx: number = -1) => (
      _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
      value?: string
    ) => {
      if (undefined !== value) {
        if (field === 'amount') {
          if (Number.isNaN(+value) || /[^\d.]/.test(value)) {
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

const useCapacityUnitChange = (updateTransactionOutput: Function) =>
  useCallback(
    (idx: number = -1) => (_e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        updateTransactionOutput('unit')(idx)(option.key)
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
  address: string,
  items: TransactionOutput[],
  dispatch: React.Dispatch<any>,
  history: any
) => {
  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const onCapacityUnitChange = useCapacityUnitChange(updateTransactionOutput)
  const onSubmit = useOnSubmit(items, dispatch)
  const addTransactionOutput = useAddTransactionOutput(dispatch)
  const removeTransactionOutput = useRemoveTransactionOutput(dispatch)
  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)
  const onClear = useClear(dispatch)

  useEffect(() => {
    if (address) {
      updateTransactionOutput('address')(0)(address)
    }
    return () => {
      clear(dispatch)
    }
  }, [address, dispatch, history, updateTransactionOutput])

  return {
    useOnTransactionChange,
    updateTransactionOutput,
    onItemChange,
    onCapacityUnitChange,
    onSubmit,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onClear,
  }
}

export default {
  useInitialize,
}
