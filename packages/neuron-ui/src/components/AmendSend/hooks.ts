import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TFunction } from 'i18next'
import { AppActions, StateAction, StateDispatch } from 'states/stateProvider/reducer'
import { getTransaction as getOnChainTransaction } from 'services/chain'
import { getTransaction as getSentTransaction } from 'services/remote'
import { isSuccessResponse } from 'utils'

const clear = (dispatch: StateDispatch) => {
  dispatch({
    type: AppActions.ClearSendState,
  })
}

const useUpdateTransactionPrice = (dispatch: StateDispatch) =>
  useCallback(
    (value: string) => {
      const price = value.split('.')[0].replace(/[^\d]/g, '')
      dispatch({
        type: AppActions.UpdateSendPrice,
        payload: price,
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

export const useInitialize = ({
  hash,
  walletID,
  price,
  dispatch,
}: {
  hash: string
  walletID: string
  price: string
  isMainnet: boolean
  dispatch: React.Dispatch<StateAction>
  t: TFunction
}) => {
  const [transaction, setTransaction] = useState<State.GeneratedTx | null>(null)
  const [size, setSize] = useState(0)
  const [minPrice, setMinPrice] = useState('0')
  const [showConfirmedAlert, setShowConfirmedAlert] = useState(false)

  const updateTransactionPrice = useUpdateTransactionPrice(dispatch)
  const onDescriptionChange = useSendDescriptionChange(dispatch)

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
    const res = await getOnChainTransaction(hash)
    const {
      // @ts-expect-error Replace-By-Fee (RBF)
      min_replace_fee: minFee,
      transaction: { outputsData },
    } = res
    if (!minFee) {
      setShowConfirmedAlert(true)
    }

    const txRes = await getSentTransaction({ hash, walletID })
    if (isSuccessResponse(txRes)) {
      const tx = txRes.result
      setTransaction({
        ...tx,
        outputsData,
      })

      setSize(tx.size)
      if (minFee) {
        const mPrice = ((BigInt(minFee) * BigInt(1000)) / BigInt(tx.size)).toString()
        setMinPrice(mPrice)
        updateTransactionPrice(mPrice)
      }
    }
  }, [hash, setShowConfirmedAlert, updateTransactionPrice, setTransaction, setSize, setMinPrice])

  useEffect(() => {
    fetchInitData()
  }, [])

  useEffect(() => {
    clear(dispatch)
  }, [walletID, dispatch])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      const {
        dataset: { walletId, status },
      } = e.target as HTMLFormElement
      e.preventDefault()
      if (status !== 'ready') {
        return
      }
      try {
        // @ts-expect-error Replace-By-Fee (RBF)
        const { min_replace_fee: minFee } = await getOnChainTransaction(hash)
        if (!minFee) {
          setShowConfirmedAlert(true)
          return
        }
        dispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            amendHash: hash,
            actionType: 'send',
          },
        })
      } catch {
        // ignore
      }
    },
    [dispatch, walletID, hash, setShowConfirmedAlert]
  )

  return {
    updateTransactionPrice,
    onDescriptionChange,
    fee,
    transaction,
    setTransaction,
    minPrice,
    showConfirmedAlert,
    onSubmit,
  }
}

export default {
  useInitialize,
}
