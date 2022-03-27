import { useCallback, useState, useMemo, useEffect } from 'react'
import { useOutputErrors, outputsToTotalAmount, CapacityUnit, validateOutputs, CKBToShannonFormatter } from 'utils'
import { useDispatch } from 'states'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { generateMultisigTx, MultisigConfig } from 'services/remote'
import { TFunction } from 'i18next'

let generateTxTimer: ReturnType<typeof setTimeout>

const generateMultisigTxWith = ({
  sendInfoList,
  multisigConfig,
  dispatch,
  setErrorMessage,
  t,
}: {
  sendInfoList: { address: string | undefined; amount: string | undefined; unit: CapacityUnit }[]
  multisigConfig: MultisigConfig
  dispatch: StateDispatch
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  t: TFunction
}) => {
  try {
    const realParams = {
      items: sendInfoList.map(item => ({
        address: item.address || '',
        capacity: CKBToShannonFormatter(item.amount, item.unit),
      })),
      multisigConfig,
    }
    generateMultisigTx(realParams)
      .then((res: any) => {
        if (res.status === 1) {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: res.result,
          })
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
          payload: '',
        })
        setErrorMessage(err.message)
      })
  } catch {
    // ignore
  }
  dispatch({
    type: AppActions.UpdateGeneratedTx,
    payload: '',
  })
}
export const useSendInfo = ({
  isMainnet,
  balance,
  multisigConfig,
  t,
}: {
  isMainnet: boolean
  balance: string
  multisigConfig: MultisigConfig
  t: TFunction
}) => {
  const [sendInfoList, setSendInfoList] = useState<
    { address: string | undefined; amount: string | undefined; unit: CapacityUnit }[]
  >([{ address: undefined, amount: undefined, unit: CapacityUnit.CKB }])
  const addSendInfo = useCallback(() => {
    setSendInfoList(v => [...v, { address: undefined, amount: undefined, unit: CapacityUnit.CKB }])
  }, [setSendInfoList])
  const deleteSendInfo = useCallback(
    e => {
      const {
        dataset: { idx = '-1' },
      } = e.currentTarget
      setSendInfoList(v => [...v.slice(0, +idx), ...v.slice(+idx + 1)])
    },
    [setSendInfoList]
  )
  const onSendInfoChange = useCallback(e => {
    const {
      dataset: { idx = '-1', field },
      value,
    } = e.currentTarget as { dataset: { idx: string; field: 'address' | 'amount' }; value: string }
    setSendInfoList(v => {
      const copy = [...v]
      if (field === 'amount') {
        const amount = value.replace(/,/g, '') || '0'
        if (Number.isNaN(+amount) || /[^\d.]/.test(amount) || +amount < 0) {
          return copy
        }
        copy[+idx][field] = amount
        return copy
      }
      copy[+idx][field] = value
      return copy
    })
  }, [])
  const outputErrors = useOutputErrors(sendInfoList, isMainnet)
  const totalAmount = useMemo(() => outputsToTotalAmount(sendInfoList.filter(v => !!v.amount)), [sendInfoList])
  const isAddOneBtnDisabled = useMemo(() => {
    return (
      outputErrors.some(v => v.addrError || v.amountError) ||
      sendInfoList.some(v => !v.address || !v.amount) ||
      BigInt(totalAmount) >= BigInt(balance)
    )
  }, [outputErrors, sendInfoList, balance, totalAmount])
  const dispatch = useDispatch()
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    clearTimeout(generateTxTimer)
    setErrorMessage('')
    const validSendInfoList = sendInfoList.filter(v => v.address && v.amount)
    generateTxTimer = setTimeout(() => {
      dispatch({
        type: AppActions.UpdateGeneratedTx,
        payload: null,
      })
      generateMultisigTxWith({
        sendInfoList: validSendInfoList,
        setErrorMessage,
        multisigConfig,
        dispatch,
        t,
      })
    }, 300)
  }, [sendInfoList, setErrorMessage, multisigConfig, dispatch, t])
  return {
    sendInfoList,
    addSendInfo,
    deleteSendInfo,
    onSendInfoChange,
    isAddOneBtnDisabled,
    outputErrors,
    totalAmount,
    errorMessage,
  }
}

export const useOnSumbit = ({
  outputs,
  isMainnet,
  multisigConfig,
}: {
  outputs: { address: string | undefined; amount: string | undefined; unit: CapacityUnit }[]
  isMainnet: boolean
  multisigConfig: MultisigConfig
}) => {
  const dispatch = useDispatch()
  return useCallback(
    (e: React.FormEvent) => {
      const {
        dataset: { walletId },
      } = e.target as HTMLFormElement
      e.preventDefault()
      try {
        validateOutputs(outputs, isMainnet)
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            actionType: 'send-from-multisig',
            multisigConfig,
          },
        })
      } catch {
        // ignore
      }
    },
    [dispatch, outputs, isMainnet, multisigConfig]
  )
}
