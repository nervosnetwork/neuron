import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TFunction } from 'i18next'
import jsQR from 'jsqr'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { captureScreenshot, showErrorMessage } from 'services/remote'
import { generateTx, generateSendingAllTx } from 'services/remote/wallets'

import {
  outputsToTotalAmount,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  calculateFee,
  validateOutputs,
  validateAddress,
} from 'utils'
import i18n from 'utils/i18n'

import styles from './send.module.scss'

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
  isMainnet,
  dispatch,
  t,
}: {
  walletID: string
  price: string
  items: Readonly<State.Output[]>
  setTotalAmount: Function
  setErrorMessage: Function
  updateTransactionOutput?: Function
  isMainnet: boolean
  dispatch: StateDispatch
  t: TFunction
}) => {
  const { value: type } = Object.getOwnPropertyDescriptor(generator, 'type')!
  if (items.length === 1 && items[0].amount === undefined) {
    setTotalAmount('0')
  } else if (type === 'common') {
    try {
      const totalAmount = outputsToTotalAmount(items)
      setTotalAmount(totalAmount)
    } catch (err) {
      console.warn(err)
    }
  }
  try {
    validateOutputs(items, isMainnet, type === 'all')
    const realParams = {
      walletID,
      items: items.map(item => ({
        address: item.address || '',
        capacity: CKBToShannonFormatter(item.amount, item.unit),
        date: item.date,
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
        if (res.status === 0) {
          throw new Error(res.message.content)
        }
        throw new Error(t(`messages.codes.${res.status}`))
      })
      .catch((err: Error) => {
        dispatch({
          type: AppActions.UpdateGeneratedTx,
          payload: '',
        })
        setErrorMessage(err.message)
        return undefined
      })
  } catch {
    // ignore
  }
  dispatch({
    type: AppActions.UpdateGeneratedTx,
    payload: '',
  })
  return Promise.resolve(undefined)
}

const useUpdateTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (field: string) => (idx: number) => (value: string | undefined) => {
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
  items: State.Output[],
  price: string,
  isMainnet: boolean,
  dispatch: StateDispatch,
  isSendMax: boolean,
  setTotalAmount: Function,
  setErrorMessage: Function,
  t: TFunction
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
        isMainnet,
        dispatch,
        t,
      })
    }, 300)
  }, [walletID, items, price, isSendMax, dispatch, setTotalAmount, setErrorMessage, t, isMainnet])
}

const useOnSubmit = (items: Readonly<State.Output[]>, isMainnet: boolean, dispatch: StateDispatch) =>
  useCallback(
    (e: React.FormEvent) => {
      const {
        dataset: { walletId, status },
      } = e.target as HTMLFormElement
      e.preventDefault()
      if (status !== 'ready') {
        return
      }
      try {
        validateOutputs(items, isMainnet)
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            actionType: 'send',
          },
        })
      } catch {
        // ignore
      }
    },
    [dispatch, items, isMainnet]
  )

const useOnItemChange = (updateTransactionOutput: Function) =>
  useCallback(
    (e: any) => {
      const {
        value,
        dataset: { field = '', idx = -1 },
      } = e.target
      if (field === 'amount') {
        const amount = value.replace(/,/g, '') || '0'
        if (Number.isNaN(+amount) || /[^\d.]/.test(amount) || +amount < 0) {
          return
        }
        updateTransactionOutput(field)(idx)(amount)
        return
      }
      if (field === 'address') {
        const address = value
        updateTransactionOutput(field)(idx)(address)
      }
    },
    [updateTransactionOutput]
  )

const useUpdateTransactionPrice = (dispatch: StateDispatch) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      const price = value.split('.')[0].replace(/[^\d]/g, '')
      dispatch({
        type: AppActions.UpdateSendPrice,
        payload: price.replace(/,/g, ''),
      })
    },
    [dispatch]
  )

const useSendDescriptionChange = (dispatch: StateDispatch) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      dispatch({
        type: AppActions.UpdateSendDescription,
        payload: value,
      })
    },
    [dispatch]
  )

const clear = (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ClearSendState,
  })
}

const useClear = (dispatch: StateDispatch) => useCallback(() => clear(dispatch), [dispatch])

export const useInitialize = (
  walletID: string,
  items: Readonly<State.Output[]>,
  generatedTx: any | null,
  price: string,
  sending: boolean,
  isMainnet: boolean,
  dispatch: React.Dispatch<any>,
  t: TFunction
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
  const onSubmit = useOnSubmit(items, isMainnet, dispatch)
  const onClear = useClear(dispatch)

  const updateSendingAllTransaction = useCallback(() => {
    updateTransactionWith(generateSendingAllTx)({
      walletID,
      items,
      price,
      setTotalAmount,
      setErrorMessage,
      updateTransactionOutput,
      isMainnet,
      dispatch,
      t,
    }).then(tx => {
      if (!tx) {
        setIsSendMax(false)
      }
    })
  }, [walletID, updateTransactionOutput, price, items, dispatch, t, isMainnet])

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

  const onScan = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const {
        dataset: { idx },
      } = e.target as HTMLButtonElement
      if (idx !== undefined && !(e.target as HTMLButtonElement).classList.contains(styles.busy)) {
        ;[...document.querySelectorAll(`.${styles.scanBtn}`)].forEach(b => b.classList.add(styles.busy))
        setTimeout(async () => {
          const codes = await captureScreenshot().then(imageDataList =>
            imageDataList.map(imageData =>
              jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              })
            )
          )
          for (let i = 0; i < codes.length; i++) {
            try {
              validateAddress(codes[i]?.data ?? '', isMainnet)
              updateTransactionOutput('address')(+idx)(codes[i]!.data)
              ;[...document.querySelectorAll(`.${styles.scanBtn}`)].forEach(b => b.classList.remove(styles.busy))
              return
            } catch {
              // ignore
            }
          }
          showErrorMessage(i18n.t('messages.error'), i18n.t('messages.no-valid-addresses-found'))
          ;[...document.querySelectorAll(`.${styles.scanBtn}`)].forEach(b => b.classList.remove(styles.busy))
        }, 100)
      }
    },
    [updateTransactionOutput, isMainnet]
  )

  useEffect(() => {
    if (isSendMax) {
      updateSendingAllTransaction()
    }
  }, [isSendMax, price, updateSendingAllTransaction])

  useEffect(() => {
    clear(dispatch)
  }, [walletID, dispatch])

  return {
    outputs,
    fee,
    totalAmount,
    setTotalAmount,
    useOnTransactionChange,
    onItemChange,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onSubmit,
    onClear,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick,
    onScan,
  }
}

export default {
  useInitialize,
}
