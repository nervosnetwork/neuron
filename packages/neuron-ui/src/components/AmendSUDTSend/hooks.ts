import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TFunction } from 'i18next'
import { AppActions } from 'states/stateProvider/reducer'
import { getTransaction as getOnChainTransaction } from 'services/chain'
import { getTransaction as getSentTransaction, getTransactionSize, getTransactionList } from 'services/remote'
import { isSuccessResponse } from 'utils'

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
  const [showConfirmedAlert, setShowConfirmedAlert] = useState(false)
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
    const ratio = BigInt(1000)
    const base = BigInt(size) * BigInt(price)
    const curFee = base / ratio
    if (curFee * ratio < base) {
      return curFee + BigInt(1)
    }
    return curFee
  }, [price, size])

  const fetchInitData = useCallback(async () => {
    const {
      // @ts-expect-error Replace-By-Fee (RBF)
      min_replace_fee: minFee,
      transaction: { outputsData },
    } = await getOnChainTransaction(hash)
    if (!minFee) {
      setShowConfirmedAlert(true)
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

      const sizeRes = await getTransactionSize(tx)

      if (isSuccessResponse(sizeRes) && typeof sizeRes.result === 'number') {
        setSize(sizeRes.result)
        if (minFee) {
          const mPrice = ((BigInt(minFee) * BigInt(1000)) / BigInt(sizeRes.result)).toString()
          setMinPrice(mPrice)
          setPrice(mPrice)
        }
      }
    }
  }, [hash, setShowConfirmedAlert, setPrice, setTransaction, setSize, setMinPrice])

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
        // @ts-expect-error Replace-By-Fee (RBF)
        const { min_replace_fee: minFee } = await getOnChainTransaction(hash)
        if (!minFee) {
          setShowConfirmedAlert(true)
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
    [dispatch, walletID, hash, setShowConfirmedAlert, transaction]
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
    showConfirmedAlert,
    onSubmit,
    sudtInfo,
    txValue,
  }
}

export default {
  useInitialize,
}
