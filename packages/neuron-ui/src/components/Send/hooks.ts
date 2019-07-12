import React, { useCallback, useEffect } from 'react'
import { IDropdownOption } from 'office-ui-fabric-react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'

import { Message } from 'utils/const'
import { verifyAddress } from 'utils/validators'
import { TransactionOutput } from '.'

const validateTransactionParams = ({ items, dispatch }: { items: TransactionOutput[]; dispatch: StateDispatch }) => {
  const errorAction = {
    type: AppActions.AddNotification,
    payload: {
      type: 'warning',
      timestamp: Date.now(),
      content: Message.AtLeastOneAddressNeeded,
    },
  }
  if (!items.length || !items[0].address) {
    dispatch(errorAction)
    return false
  }
  const invalid = items.some(
    (item): boolean => {
      if (!verifyAddress(item.address)) {
        errorAction.payload.content = Message.InvalidAddress
        return true
      }
      if (Number.isNaN(+item.amount) || +item.amount < 0) {
        errorAction.payload.content = Message.InvalidAmount
        return true
      }
      const [, decimal = ''] = item.amount.split('.')
      if (decimal.length > 8) {
        errorAction.payload.content = Message.InvalidAmount
        return true
      }
      return false
    }
  )
  if (invalid) {
    dispatch(errorAction)
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
        updateTransactionOutput(field)(idx)(value)
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
        dispatch({
          type: AppActions.UpdateSendPrice,
          payload: value.trim(),
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
