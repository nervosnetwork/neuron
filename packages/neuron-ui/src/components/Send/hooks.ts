import React, { useCallback, useEffect, useMemo } from 'react'
import { History } from 'history'
import { IDropdownOption } from 'office-ui-fabric-react'
import { TransactionOutput } from 'services/UILayer'
import { MainActions, actionCreators } from 'containers/MainContent/reducer'
import initState from 'containers/MainContent/state'
import { MainDispatch } from '../../containers/MainContent/reducer'

const useUpdateTransactionOutput = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: MainActions.UpdateSendOutput,
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

const useAddTransactionOutput = (dispatch: React.Dispatch<any>) =>
  useCallback(() => {
    dispatch({
      type: MainActions.AddSendOutput,
    })
  }, [dispatch])

const useRemoveTransactionOutput = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (idx: number) => {
      dispatch({
        type: MainActions.RemoveSendOutput,
        payload: idx,
      })
    },
    [dispatch]
  )

const useOnSubmit = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (id: string, items: TransactionOutput[], description: string) => () => {
      setTimeout(() => {
        dispatch(actionCreators.submitTransaction(id, items, description))
      }, 10)
    },
    [dispatch]
  )

const useOnItemChange = (updateTransactionOutput: Function) => (field: string, idx: number) => (
  _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  newValue?: string
) => {
  if (undefined !== newValue) {
    updateTransactionOutput(field)(idx)(newValue)
  }
}

const useCapacityUnitChange = (updateTransactionOutput: Function) =>
  useCallback(
    (idx: number) => (_e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        updateTransactionOutput('unit')(idx)(option.key)
      }
    },
    [updateTransactionOutput]
  )

const useUpdateTransactionPrice = (dispatch: any) =>
  useCallback(
    (e: any) => {
      dispatch({
        type: MainActions.UpdateSendPrice,
        paylaod: e.currentTarget.value,
      })
    },
    [dispatch]
  )

const useSendDescriptionChange = (dispatch: MainDispatch) =>
  useCallback(
    (_e, newValue?: string) => {
      if (undefined !== newValue) {
        dispatch({
          type: MainActions.UpdateSendDescription,
          payload: newValue,
        })
      }
    },
    [dispatch]
  )

const clear = (dispatch: MainDispatch) => {
  dispatch({
    type: MainActions.UpdateSendState,
    payload: initState.send,
  })
}

const useClear = (dispatch: MainDispatch) => useCallback(() => clear(dispatch), [dispatch])

export const useInitialize = (address: string, dispatch: React.Dispatch<any>, history: History) => {
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
