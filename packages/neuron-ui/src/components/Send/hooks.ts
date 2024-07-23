import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TFunction } from 'i18next'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { generateTx, generateSendingAllTx } from 'services/remote/wallets'
import { ControllerResponse, SuccessFromController } from 'services/remote/remoteApiWrapper'

import {
  outputsToTotalAmount,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  scriptToAddress,
  calculateFee,
  validateOutputs,
  DefaultLockInfo,
  RoutePath,
} from 'utils'
import { PlaceHolderArgs } from 'utils/const'
import { useNavigate } from 'react-router-dom'

let generateTxTimer: ReturnType<typeof setTimeout>

Object.defineProperty(generateTx, 'type', {
  value: 'common',
})
Object.defineProperty(generateSendingAllTx, 'type', {
  value: 'all',
})

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

const updateTransactionWith =
  (generator: typeof generateTx | typeof generateSendingAllTx) =>
  ({
    walletID,
    price,
    items,
    setTotalAmount,
    setErrorMessage,
    updateTransactionOutput,
    isMainnet,
    enableUseSentCell,
    dispatch,
    t,
    consumeOutPoints,
  }: {
    walletID: string
    price: string
    items: Readonly<State.Output[]>
    setTotalAmount: (val: string) => void
    setErrorMessage: (val: string) => void
    updateTransactionOutput?: ReturnType<typeof useUpdateTransactionOutput>
    isMainnet: boolean
    enableUseSentCell: boolean
    dispatch: StateDispatch
    t: TFunction
    consumeOutPoints?: CKBComponents.OutPoint[]
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
        consumeOutPoints,
        enableUseSentCell,
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
                amount: shannonToCKBFormatter(res.result.outputs[i].capacity, false, false),
              }))
              const totalAmount = outputsToTotalAmount(fmtItems)
              setTotalAmount(totalAmount)
              if (updateTransactionOutput) {
                updateTransactionOutput('amount')(items.length - 1)(fmtItems[fmtItems.length - 1].amount)
              }
            }
            return res.result
          }
          if (res.status === 0 || res.status === 114) {
            throw new Error(res.message.content)
          }
          throw new Error(t(`messages.codes.${res.status}`))
        })
        .catch((err: Error) => {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: null,
          })
          setErrorMessage(err.message)
          return undefined
        })
    } catch {
      // ignore
    }
    dispatch({
      type: AppActions.UpdateGeneratedTx,
      payload: null,
    })
    return Promise.resolve(undefined)
  }

const useAddTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(() => {
    dispatch({
      type: AppActions.AddSendOutput,
    })
  }, [dispatch])

const useRemoveTransactionOutput = (dispatch: StateDispatch) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const {
        dataset: { idx = '-1' },
      } = e.currentTarget
      const index = +idx
      if (index >= 0) {
        dispatch({
          type: AppActions.RemoveSendOutput,
          payload: index,
        })
      }
    },
    [dispatch]
  )

const useOnTransactionChange = ({
  walletID,
  items,
  price,
  isMainnet,
  dispatch,
  isSendMax,
  setTotalAmount,
  setErrorMessage,
  t,
  consumeOutPoints,
  enableUseSentCell,
}: {
  walletID: string
  items: State.Output[]
  price: string
  isMainnet: boolean
  dispatch: StateDispatch
  isSendMax: boolean
  setTotalAmount: (val: string) => void
  setErrorMessage: (val: string) => void
  t: TFunction
  consumeOutPoints?: CKBComponents.OutPoint[]
  enableUseSentCell: boolean
}) => {
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
        consumeOutPoints,
        enableUseSentCell,
      })
    }, 300)
  }, [
    walletID,
    items,
    price,
    isSendMax,
    dispatch,
    setTotalAmount,
    setErrorMessage,
    t,
    isMainnet,
    consumeOutPoints,
    enableUseSentCell,
  ])
}

const useOnSubmit = ({
  items,
  isMainnet,
  dispatch,
  enableUseSentCell,
}: {
  items: Readonly<State.Output[]>
  isMainnet: boolean
  dispatch: StateDispatch
  enableUseSentCell: boolean
}) => {
  const navigate = useNavigate()
  return useCallback(
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
        if (enableUseSentCell) {
          navigate(RoutePath.SendTxDetail)
        } else {
          dispatch({
            type: AppActions.RequestPassword,
            payload: {
              walletID: walletId as string,
              actionType: 'send',
            },
          })
        }
      } catch {
        // ignore
      }
    },
    [dispatch, items, isMainnet, enableUseSentCell, navigate]
  )
}
const useOnItemChange = (updateTransactionOutput: ReturnType<typeof useUpdateTransactionOutput>) =>
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
    (value: string) => {
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

export type FeeRateValueArrayItemType = {
  feeRateValue: string
  feeValue: string
}

export const useGetBatchGeneratedTx = async ({
  walletID,
  priceArray = [],
  items,
  isSendMax,
  enableUseSentCell,
}: {
  walletID: string
  priceArray?: string[]
  items: Readonly<State.Output[]>
  isSendMax: boolean
  enableUseSentCell?: boolean
}) => {
  const getUpdateGeneratedTx = (params: Controller.GenerateTransactionParams) =>
    (isSendMax ? generateSendingAllTx : generateTx)(params).then((res: ControllerResponse<State.Transaction>) => {
      if (res.status === 1) {
        return (res as SuccessFromController).result
      }
      return res
    })

  const realParams = {
    walletID,
    items: items.map(item => ({
      address: item.address!,
      capacity: CKBToShannonFormatter(item.amount, item.unit),
      date: item.date,
    })),
  }

  const requestArray = priceArray.map(itemPrice =>
    getUpdateGeneratedTx({ ...realParams, feeRate: itemPrice, enableUseSentCell })
  )
  const allPromiseResult = await Promise.allSettled<State.Transaction>(requestArray)

  const feeRateValueArray: FeeRateValueArrayItemType[] = allPromiseResult?.map(
    (batchItem: PromiseSettledResult<State.Transaction>, index: number) => ({
      feeRateValue: priceArray[index],
      feeValue: batchItem.status === 'fulfilled' ? calculateFee(batchItem.value) : '',
    })
  )

  return feeRateValueArray
}

export const useInitialize = ({
  walletID,
  items,
  generatedTx,
  price,
  sending,
  isMainnet,
  consumeOutPoints,
  enableUseSentCell,
  dispatch,
  t,
}: {
  walletID: string
  items: Readonly<State.Output[]>
  generatedTx: any | null
  price: string
  sending: boolean
  isMainnet: boolean
  consumeOutPoints?: CKBComponents.OutPoint[]
  enableUseSentCell: boolean
  dispatch: React.Dispatch<any>
  t: TFunction
}) => {
  const fee = useMemo(() => calculateFee(generatedTx), [generatedTx])

  const [totalAmount, setTotalAmount] = useState('0')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSendMax, setIsSendMax] = useState(false)

  const outputs = useMemo(() => items.map(item => ({ ...item, disabled: sending })), [items, sending])

  const updateIsSendMax = useCallback(
    (payload: boolean) => {
      setIsSendMax(payload)
      dispatch({
        type: AppActions.UpdateSendIsSendMax,
        payload,
      })
    },
    [dispatch, setIsSendMax]
  )

  const updateTransactionOutput = useUpdateTransactionOutput(dispatch)
  const onItemChange = useOnItemChange(updateTransactionOutput)
  const addTransactionOutput = useAddTransactionOutput(dispatch)
  const removeTransactionOutput = useRemoveTransactionOutput(dispatch)
  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)
  const onSubmit = useOnSubmit({ items, isMainnet, dispatch, enableUseSentCell })
  const onClear = useClear(dispatch)

  const updateSendingAllTransaction = useCallback(() => {
    updateTransactionWith(generateSendingAllTx)({
      walletID,
      items: items.map(v => ({
        ...v,
        address:
          v.address ||
          scriptToAddress(
            {
              codeHash: DefaultLockInfo.CodeHash,
              hashType: DefaultLockInfo.HashType,
              args: PlaceHolderArgs,
            },
            { isMainnet }
          ),
      })),
      price,
      setTotalAmount,
      setErrorMessage,
      updateTransactionOutput,
      isMainnet,
      enableUseSentCell,
      dispatch,
      t,
      consumeOutPoints,
    }).then(tx => {
      if (!tx) {
        updateIsSendMax(false)
      }
    })
  }, [
    walletID,
    updateTransactionOutput,
    price,
    items,
    dispatch,
    t,
    isMainnet,
    updateIsSendMax,
    consumeOutPoints,
    enableUseSentCell,
  ])

  const onSendMaxClick = useCallback(() => {
    if (!isSendMax) {
      updateIsSendMax(true)
      updateSendingAllTransaction()
    } else {
      updateIsSendMax(false)
      updateTransactionOutput('amount')(outputs.length - 1)('')
      const total = outputsToTotalAmount(items.filter(item => item.amount))
      setTotalAmount(total)
    }
  }, [updateSendingAllTransaction, updateIsSendMax, isSendMax, outputs.length, updateTransactionOutput, items])

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
    updateIsSendMax,
  }
}

export const useSendWithSentCell = () => {
  const [enableUseSentCell, setEnableUseSentCell] = useState(false)
  const onChangeEnableUseSentCell = useCallback(() => {
    setEnableUseSentCell(v => !v)
  }, [])
  return {
    enableUseSentCell,
    onChangeEnableUseSentCell,
  }
}

export default {
  useInitialize,
}
