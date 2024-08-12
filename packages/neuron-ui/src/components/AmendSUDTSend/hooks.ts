import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TFunction } from 'i18next'
import { AppActions } from 'states/stateProvider/reducer'
import { getTransaction as getOnChainTransaction } from 'services/chain'
import { getTransaction as getSentTransaction, getTransactionList } from 'services/remote'
import { isSuccessResponse } from 'utils'
import { FEE_RATIO } from 'utils/const'

export const useInitialize = ({
  hash,
  walletID,
  dispatch,
}: {
  hash: string
  walletID: string
  isMainnet: boolean
  dispatch: React.Dispatch<any>
  t: TFunction
}) => {
  const [transaction, setTransaction] = useState<State.GeneratedTx | null>(null)
  const [size, setSize] = useState(0)
  const [minPrice, setMinPrice] = useState('0')
  const [price, setPrice] = useState('0')
  const [description, setDescription] = useState('')
  const [isConfirmedAlertShown, setIsConfirmedAlertShown] = useState(false)
  const [sudtInfo, setSudtInfo] = useState<State.Transaction['sudtInfo'] | null>(null)
  const [txValue, setTxValue] = useState('0')

  const onDescriptionChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setDescription(value)
    },
    [dispatch]
  )

  const fee = useMemo(() => {
    const ratio = BigInt(FEE_RATIO)
    const base = BigInt(size) * BigInt(price)
    const curFee = base / ratio
    if (curFee * ratio < base) {
      return curFee + BigInt(1)
    }
    return curFee
  }, [price, size])

  const fetchInitData = useCallback(async () => {
    const {
      minReplaceFee,
      transaction: { outputsData },
    } = await getOnChainTransaction(hash)
    if (!minReplaceFee) {
      setIsConfirmedAlertShown(true)
    }

    const listRes = await getTransactionList({
      walletID,
      pageNo: 1,
      pageSize: 10,
      keywords: hash,
    })
    if (isSuccessResponse(listRes)) {
      const list = listRes.result.items
      if (list.length) {
        const { sudtInfo: info, value } = list[0]
        setSudtInfo(info)
        setTxValue(value)
      }
    }

    const txRes = await getSentTransaction({ hash, walletID })
    if (isSuccessResponse(txRes)) {
      const tx = txRes.result

      setTransaction({ ...tx, outputsData })

      setSize(tx.size)
      if (minReplaceFee) {
        const mPrice = ((BigInt(minReplaceFee) * BigInt(FEE_RATIO)) / BigInt(tx.size)).toString()
        setMinPrice(mPrice)
        setPrice(mPrice)
      }
    }
  }, [hash, setIsConfirmedAlertShown, setPrice, setTransaction, setSize, setMinPrice])

  useEffect(() => {
    fetchInitData()
  }, [])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      const {
        dataset: { walletId, status },
      } = e.target as HTMLFormElement
      e.preventDefault()
      if (status !== 'ready' || !transaction) {
        return
      }
      try {
        const { minReplaceFee } = await getOnChainTransaction(hash)
        if (!minReplaceFee) {
          setIsConfirmedAlertShown(true)
          return
        }

        const actionType =
          transaction.inputs.length > transaction.witnesses.length ? 'send-sudt' : 'send-acp-sudt-to-new-cell'

        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            amendHash: hash,
            actionType,
          },
        })
      } catch {
        // ignore
      }
    },
    [dispatch, walletID, hash, setIsConfirmedAlertShown, transaction]
  )

  return {
    setPrice,
    price,
    description,
    onDescriptionChange,
    fee,
    transaction,
    setTransaction,
    minPrice,
    isConfirmedAlertShown,
    onSubmit,
    sudtInfo,
    txValue,
  }
}

export default {
  useInitialize,
}
