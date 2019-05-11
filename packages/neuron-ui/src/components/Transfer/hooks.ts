import React, { useCallback, useEffect } from 'react'
import { History } from 'history'
import { TransferItem } from 'services/UILayer'
import { MainActions, actionCreators } from 'containers/MainContent/reducer'
import { CapacityUnit } from 'utils/const'
import initState from 'containers/MainContent/state'

export const useUpdateTransferItem = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (field: string) => (idx: number) => (value: string) => {
      dispatch({
        type: MainActions.UpdateItemInTransfer,
        payload: {
          idx,
          item: {
            [field]: value,
          },
        },
      })
    },
    [dispatch],
  )

export const useOnSubmit = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (items: TransferItem[]) => () => {
      dispatch(actionCreators.submitTransfer(items))
    },
    [dispatch],
  )

export const useOnPasswordChange = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      dispatch({
        type: MainActions.UpdatePassword,
        payload: e.currentTarget.value,
      })
    },
    [dispatch],
  )

export const useOnConfirm = (dispatch: React.Dispatch<any>, setLoading: Function) =>
  useCallback(
    (id: string, items: TransferItem[], pwd: string) => () => {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open: false,
        },
      })
      dispatch({
        type: MainActions.UpdatePassword,
        payload: '',
      })
      setLoading(true)
      setTimeout(() => {
        dispatch(
          actionCreators.confirmTransfer({
            id,
            items,
            password: pwd,
          }),
        )
      }, 10)
    },
    [dispatch, setLoading],
  )

export const useOnItemChange = (updateTransferItem: Function) => (field: string, idx: number) => (
  e: React.FormEvent<{ value: string }>,
) => {
  updateTransferItem(field)(idx)(e.currentTarget.value)
}

export const useDropdownItems = (updateTransferItem: Function) =>
  useCallback(
    (idx: number) =>
      Object.values(CapacityUnit)
        .filter(unit => typeof unit === 'string')
        .map((unit: string) => ({
          label: unit.toUpperCase(),
          key: unit,
          onClick: () => updateTransferItem('unit')(idx)(unit),
        })),
    [updateTransferItem],
  )

export const useInitialize = (
  address: string,
  dispatch: React.Dispatch<any>,
  history: History,
  updateTransferItem: Function,
) =>
  useEffect(() => {
    if (address) {
      updateTransferItem('address')(0)(address)
    }
    return () => {
      dispatch({
        type: MainActions.UpdateTransfer,
        payload: initState.transfer,
      })
    }
  }, [address, dispatch, history, updateTransferItem])

export const useMessageListener = (id: string, messageId: string | null, title: string, setLoading: Function) => {
  useEffect(() => {
    if (title === 'Transaction' && messageId === id) {
      setLoading(false)
    }
  }, [title, messageId, id, setLoading])
}

export default {
  useUpdateTransferItem,
  useOnSubmit,
  useOnPasswordChange,
  useOnConfirm,
  useOnItemChange,
  useDropdownItems,
  useMessageListener,
  useInitialize,
}
