import React, { useState, useCallback, useEffect, useMemo } from 'react'
import produce from 'immer'

import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { generateTx, generateSendingAllTx } from 'services/remote/wallets'

import { outputsToTotalAmount, CKBToShannonFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { verifyAddress, verifyAmount, verifyAmountRange, verifyTransactionOutputs } from 'utils/validators'
import { ErrorCode, MAINNET_TAG } from 'utils/const'
import calculateFee from 'utils/calculateFee'

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
  items: Readonly<State.Output[]>
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

const useOnSubmit = (items: Readonly<State.Output[]>, dispatch: StateDispatch) =>
  useCallback(
    (walletID: string = '') => () => {
      if (verifyTransactionOutputs(items)) {
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

const useOnItemChange = (
  updateTransactionOutput: Function,
  setOutputErrors: React.Dispatch<React.SetStateAction<any>>
) =>
  useCallback(
    (e: any) => {
      const {
        value,
        dataset: { field = '', idx = -1, chainType = MAINNET_TAG },
      } = e.target
      if (field === 'amount') {
        const amount = value.replace(/,/g, '') || '0'
        if (Number.isNaN(+amount) || /[^\d.]/.test(amount) || +amount < 0) {
          return
        }
        updateTransactionOutput(field)(idx)(amount)

        let amountErrorCode = ''
        const msg = verifyAmount(amount)
        if (typeof msg === 'object') {
          amountErrorCode = `${msg.code}`
        } else if (!verifyAmountRange(amount)) {
          amountErrorCode = `${ErrorCode.AmountTooSmall}`
        }
        setOutputErrors(
          /* eslint-disable no-param-reassign */
          produce(errors => {
            if (errors[idx]) {
              errors[idx].amountErrorCode = amountErrorCode
            } else {
              errors[idx] = {
                amountErrorCode,
                addrErrorCode: '',
              }
            }
          })
          /* eslint-enable no-param-reassign */
        )
        return
      }
      if (field === 'address') {
        const address = value
        updateTransactionOutput(field)(idx)(address)

        let addrErrorCode = ''
        if (address === '') {
          addrErrorCode = `${ErrorCode.AddressIsEmpty}`
        } else if (chainType === MAINNET_TAG && !address.startsWith('ckb')) {
          addrErrorCode = `${ErrorCode.MainnetAddressRequired}`
        } else if (chainType !== MAINNET_TAG && !address.startsWith('ckt')) {
          addrErrorCode = `${ErrorCode.TestnetAddressRequired}`
        } else if (!verifyAddress(address)) {
          addrErrorCode = `${ErrorCode.FieldInvalid}`
        }
        setOutputErrors(
          /* eslint-disable no-param-reassign */
          produce(errors => {
            if (errors[idx]) {
              errors[idx].addrErrorCode = addrErrorCode
            } else {
              errors[idx] = {
                addrErrorCode,
                amountErrorCode: '',
              }
            }
          })
          /* eslint-enable no-param-reassign */
        )
      }
    },
    [updateTransactionOutput, setOutputErrors]
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
  dispatch: React.Dispatch<any>
) => {
  const fee = useMemo(() => calculateFee(generatedTx), [generatedTx])

  const [totalAmount, setTotalAmount] = useState('0')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSendMax, setIsSendMax] = useState(false)
  const [outputErrors, setOutputErrors] = useState<{ addrErrorCode: string; amountErrorCode: string }[]>([])

  const outputs = useMemo(() => items.map(item => ({ ...item, disabled: isSendMax || sending })), [
    items,
    isSendMax,
    sending,
  ])

  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput, setOutputErrors)
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
    updateTransactionPrice,
    onDescriptionChange,
    onSubmit,
    onClear,
    outputErrors,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick,
  }
}

export default {
  useInitialize,
}
