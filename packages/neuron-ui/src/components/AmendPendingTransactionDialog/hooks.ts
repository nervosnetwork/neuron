import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { PasswordIncorrectException } from 'exceptions'
import { TFunction } from 'i18next'
import { getTransaction as getOnChainTransaction } from 'services/chain'
import {
  getTransaction as getSentTransaction,
  getTransactionSize,
  sendTx,
  invokeShowErrorMessage,
} from 'services/remote'
import { isSuccessResponse, ErrorCode } from 'utils'

export const useInitialize = ({
  hash,
  walletID,
  t,
  onClose,
}: {
  hash: string
  walletID: string
  t: TFunction
  onClose: () => void
}) => {
  const [transaction, setTransaction] = useState<State.GeneratedTx | null>(null)
  const [generatedTx, setGeneratedTx] = useState<State.GeneratedTx | null>(null)
  const [size, setSize] = useState(0)
  const [minPrice, setMinPrice] = useState('0')
  const [price, setPrice] = useState('0')
  const [password, setPassword] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [sending, setSending] = useState(false)

  const [showConfirmedAlert, setShowConfirmedAlert] = useState(false)

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

  const onPwdChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      setPassword(value)
      setPwdError('')
    },
    [setPassword, setPwdError]
  )

  const onSubmit = useCallback(async () => {
    try {
      // @ts-expect-error Replace-By-Fee (RBF)
      const { min_replace_fee: minFee } = await getOnChainTransaction(hash)
      if (!minFee) {
        setShowConfirmedAlert(true)
        return
      }

      if (!generatedTx) {
        return
      }
      setSending(true)

      try {
        const skipLastInputs = generatedTx.inputs.length > generatedTx.witnesses.length

        const res = await sendTx({ walletID, tx: generatedTx, password, skipLastInputs, amendHash: hash })

        if (isSuccessResponse(res)) {
          onClose()
        } else if (res.status === ErrorCode.PasswordIncorrect) {
          setPwdError(t(new PasswordIncorrectException().message))
        } else {
          invokeShowErrorMessage({
            title: t('messages.error'),
            content: typeof res.message === 'string' ? res.message : res.message.content!,
          })
        }
      } catch (err) {
        console.warn(err)
      } finally {
        setSending(false)
      }
    } catch {
      // ignore
    }
  }, [walletID, hash, setShowConfirmedAlert, setPwdError, password, generatedTx, setSending])

  return {
    fee,
    price,
    setPrice,
    generatedTx,
    setGeneratedTx,
    transaction,
    setTransaction,
    minPrice,
    showConfirmedAlert,
    onSubmit,
    password,
    onPwdChange,
    pwdError,
    sending,
    setSending,
  }
}

export default {
  useInitialize,
}
