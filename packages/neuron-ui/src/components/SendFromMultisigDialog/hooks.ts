import { useCallback, useState, useMemo, useEffect } from 'react'
import {
  useOutputErrors,
  outputsToTotalAmount,
  CapacityUnit,
  validateOutputs,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
} from 'utils'
import { useDispatch } from 'states'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { generateMultisigTx, MultisigConfig, generateMultisigSendAllTx } from 'services/remote'
import { TFunction } from 'i18next'

let generateTxTimer: ReturnType<typeof setTimeout>
Object.defineProperty(generateMultisigTx, 'type', {
  value: 'common',
})
Object.defineProperty(generateMultisigSendAllTx, 'type', {
  value: 'all',
})

const generateMultisigTxWith = (generator: typeof generateMultisigTx | typeof generateMultisigSendAllTx) => ({
  sendInfoList,
  multisigConfig,
  dispatch,
  setErrorMessage,
  t,
  isMainnet,
}: {
  sendInfoList: { address: string | undefined; amount: string | undefined; unit: CapacityUnit }[]
  multisigConfig: MultisigConfig
  dispatch: StateDispatch
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  t: TFunction
  isMainnet: boolean
}) => {
  try {
    const { value: type } = Object.getOwnPropertyDescriptor(generator, 'type')!
    validateOutputs(sendInfoList, isMainnet, type === 'all')
    const realParams = {
      items: sendInfoList.map(item => ({
        address: item.address || '',
        capacity: CKBToShannonFormatter(item.amount, item.unit),
      })),
      multisigConfig,
    }
    return generator(realParams)
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
    // ignore catch
  }
  dispatch({
    type: AppActions.UpdateGeneratedTx,
    payload: '',
  })
  return Promise.resolve(undefined)
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
  const onSendInfoChange = useCallback(
    e => {
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
    },
    [setSendInfoList]
  )
  const outputErrors = useOutputErrors(sendInfoList, isMainnet)
  const totalAmount = useMemo(
    () => outputsToTotalAmount(sendInfoList.filter((v, idx) => !!v.amount && !outputErrors[idx].amountError)),
    [sendInfoList, outputErrors]
  )
  const isAddOneBtnDisabled = useMemo(() => {
    return (
      outputErrors.some(v => v.addrError || v.amountError) ||
      sendInfoList.some(v => !v.address || !v.amount) ||
      !balance ||
      !totalAmount ||
      BigInt(totalAmount) >= BigInt(balance)
    )
  }, [outputErrors, sendInfoList, balance, totalAmount])
  const dispatch = useDispatch()
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    clearTimeout(generateTxTimer)
    setErrorMessage('')
    const validSendInfoList = sendInfoList.filter(
      (v, i) => v.address && v.amount && !outputErrors[i].addrError && !outputErrors[i].amountError
    )
    generateTxTimer = setTimeout(() => {
      dispatch({
        type: AppActions.UpdateGeneratedTx,
        payload: null,
      })
      if (validSendInfoList.length) {
        generateMultisigTxWith(generateMultisigTx)({
          sendInfoList: validSendInfoList,
          setErrorMessage,
          multisigConfig,
          dispatch,
          t,
          isMainnet,
        })
      }
    }, 300)
  }, [sendInfoList, setErrorMessage, multisigConfig, dispatch, t, isMainnet, outputErrors])
  const [isSendMax, setIsSendMax] = useState(false)
  const onSendMaxClick = useCallback(
    e => {
      const {
        dataset: { isOn = 'false' },
      } = e.currentTarget
      setIsSendMax(isOn === 'false')
      if (isOn === 'false') {
        generateMultisigTxWith(generateMultisigSendAllTx)({
          sendInfoList,
          setErrorMessage,
          multisigConfig,
          dispatch,
          t,
          isMainnet,
        }).then(res => {
          if (res && res.outputs && res.outputs.length) {
            setSendInfoList(v => [
              ...v.slice(0, v.length - 1),
              {
                ...v[v.length - 1],
                amount: shannonToCKBFormatter(res.outputs[res.outputs.length - 1].capacity, false, ''),
                disabled: true,
              },
            ])
          }
        })
      } else {
        setSendInfoList(v => [
          ...v.slice(0, v.length - 1),
          {
            ...v[v.length - 1],
            amount: '0',
            disabled: false,
          },
        ])
      }
    },
    [setIsSendMax, sendInfoList, setErrorMessage, multisigConfig, dispatch, t, isMainnet]
  )
  const isMaxBtnDisabled = useMemo(() => {
    try {
      validateOutputs(sendInfoList, isMainnet, true)
    } catch {
      return true
    }
    return false
  }, [sendInfoList, isMainnet])
  return {
    sendInfoList,
    addSendInfo,
    deleteSendInfo,
    onSendInfoChange,
    isAddOneBtnDisabled,
    outputErrors,
    totalAmount,
    errorMessage,
    onSendMaxClick,
    isSendMax,
    isMaxBtnDisabled,
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
            actionType: multisigConfig.m === 1 ? 'send-from-multisig-need-one' : 'send-from-multisig',
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
