import React, { useCallback, useEffect, useMemo } from 'react'
import { History } from 'history'
import { TransactionOutput } from 'services/UILayer'
import { MainActions, actionCreators } from 'containers/MainContent/reducer'
import { CapacityUnit } from 'utils/const'
import initState from 'containers/MainContent/state'
import { MainDispatch } from '../../containers/MainContent/reducer'

const useUpdateTransactionOutput = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: MainActions.UpdateTransactionOutput,
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
      type: MainActions.AddTransactionOutput,
    })
  }, [dispatch])

const useRemoveTransactionOutput = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (idx: number) => {
      dispatch({
        type: MainActions.RemoveTransactionOutput,
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
  e: React.FormEvent<{ value: string }>
) => {
  updateTransactionOutput(field)(idx)(e.currentTarget.value)
}

const useDropdownItems = (updateTransactionOutput: Function) =>
  useCallback(
    (idx: number) =>
      Object.values(CapacityUnit)
        .filter(unit => typeof unit === 'string')
        .map((unit: string) => ({
          label: unit.toUpperCase(),
          key: unit,
          onClick: () => updateTransactionOutput('unit')(idx)(unit),
        })),
    [updateTransactionOutput]
  )

const useUpdateTransactionPrice = (dispatch: any) =>
  useCallback(
    (e: any) => {
      dispatch({
        type: MainActions.UpdateTransactionPrice,
        paylaod: e.currentTarget.value,
      })
    },
    [dispatch]
  )

const useSendDescriptionChange = (dispatch: MainDispatch) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      dispatch({
        type: MainActions.UpdateSendDescription,
        payload: e.currentTarget.value,
      })
    },
    [dispatch]
  )

export const useInitialize = (address: string, dispatch: React.Dispatch<any>, history: History) => {
  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const dropdownItems = useDropdownItems(updateTransactionOutput)
  const onSubmit = useOnSubmit(dispatch)
  const addTransactionOutput = useAddTransactionOutput(dispatch)
  const removeTransactionOutput = useRemoveTransactionOutput(dispatch)
  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)

  useEffect(() => {
    if (address) {
      updateTransactionOutput('address')(0)(address)
    }
    return () => {
      dispatch({
        type: MainActions.UpdateSendState,
        payload: initState.send,
      })
    }
  }, [address, dispatch, history, updateTransactionOutput])

  const id = useMemo(() => Math.round(Math.random() * 1000).toString(), [])

  return {
    id,
    updateTransactionOutput,
    onItemChange,
    dropdownItems,
    onSubmit,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
  }
}

export default {
  useInitialize,
}
