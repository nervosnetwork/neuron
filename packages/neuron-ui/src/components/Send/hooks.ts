import React, { useCallback, useEffect, useMemo } from 'react'
import { IDropdownOption } from 'office-ui-fabric-react'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

import { TransactionOutput } from '.'

const useUpdateTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: AppActions.UpdateSendOutput,
        payload: {
          idx,
          item: {
            [field]: value,
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

const useOnSubmit = (dispatch: StateDispatch) =>
  useCallback(
    (id: string = '', walletID: string = '', items: TransactionOutput[] = [], description: string = '') => () => {
      setTimeout(() => {
        dispatch(actionCreators.submitTransaction(id, walletID, items, description))
      }, 10)
    },
    [dispatch]
  )

const useOnItemChange = (updateTransactionOutput: Function) => (field: string = '', idx: number = -1) => (
  _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  value?: string
) => {
  if (undefined !== value) {
    updateTransactionOutput(field)(idx)(value)
  }
}

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
          payload: value,
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

export const useInitialize = (address: string, dispatch: React.Dispatch<any>, history: any) => {
  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const onCapacityUnitChange = useCapacityUnitChange(updateTransactionOutput)
  const onSubmit = useOnSubmit(dispatch)
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

  // TODO: generate new id on every submission
  const id = useMemo(() => Math.round(Math.random() * 1000).toString(), [])

  return {
    id,
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
