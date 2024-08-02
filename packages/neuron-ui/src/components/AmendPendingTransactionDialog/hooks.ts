import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { PasswordIncorrectException } from 'exceptions'
import { TFunction } from 'i18next'
import { getTransaction as getOnChainTransaction } from 'services/chain'
import { getTransaction as getSentTransaction, sendTx, invokeShowErrorMessage } from 'services/remote'
import { isSuccessResponse, ErrorCode, shannonToCKBFormatter, scriptToAddress } from 'utils'
import { FEE_RATIO } from 'utils/const'

export const useInitialize = ({
  tx,
  walletID,
  t,
  onClose,
}: {
  tx: State.Transaction
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
  const [isSending, setIsSending] = useState(false)

  const [isConfirmedAlertShown, setIsConfirmedAlertShown] = useState(false)

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
    const res = await getOnChainTransaction(tx.hash)
    const {
      minReplaceFee,
      transaction: { outputsData },
    } = res

    if (!minReplaceFee) {
      setIsConfirmedAlertShown(true)
    }

    const txRes = await getSentTransaction({ hash: tx.hash, walletID })

    if (isSuccessResponse(txRes)) {
      const txResult = txRes.result
      setTransaction({
        ...txResult,
        outputsData,
      })

      setSize(txResult.size)
      if (minReplaceFee) {
        const mPrice = ((BigInt(minReplaceFee) * BigInt(FEE_RATIO)) / BigInt(txResult.size)).toString()
        setMinPrice(mPrice)
        setPrice(mPrice)
      }
    }
  }, [tx, setIsConfirmedAlertShown, setPrice, setTransaction, setSize, setMinPrice])

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
      const { minReplaceFee } = await getOnChainTransaction(tx.hash)
      if (!minReplaceFee) {
        setIsConfirmedAlertShown(true)
        return
      }

      if (!generatedTx) {
        return
      }
      setIsSending(true)

      try {
        const skipLastInputs = generatedTx.inputs.length > generatedTx.witnesses.length

        const res = await sendTx({ walletID, tx: generatedTx, password, skipLastInputs, amendHash: tx.hash })

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
        setIsSending(false)
      }
    } catch {
      // ignore
    }
  }, [walletID, tx, setIsConfirmedAlertShown, setPwdError, password, generatedTx, setIsSending])

  return {
    fee,
    price,
    setPrice,
    generatedTx,
    setGeneratedTx,
    transaction,
    setTransaction,
    minPrice,
    isConfirmedAlertShown,
    onSubmit,
    password,
    onPwdChange,
    pwdError,
    isSending,
    setIsSending,
  }
}

export const useOutputs = ({
  transaction,
  isMainnet,
  addresses,
  sUDTAccounts,
  fee,
}: {
  transaction: State.GeneratedTx | null
  isMainnet: boolean
  addresses: State.Address[]
  sUDTAccounts: State.SUDTAccount[]
  fee: bigint
}) => {
  const getLastOutputAddress = (outputs: State.DetailedOutput[]) => {
    if (outputs.length === 1) {
      return scriptToAddress(outputs[0].lock, { isMainnet })
    }

    const change = outputs.find(output => {
      const address = scriptToAddress(output.lock, { isMainnet })
      return !!addresses.find(item => item.address === address && item.type === 1)
    })

    if (change) {
      return scriptToAddress(change.lock, { isMainnet })
    }

    const receive = outputs.find(output => {
      const address = scriptToAddress(output.lock, { isMainnet })
      return !!addresses.find(item => item.address === address && item.type === 0)
    })
    if (receive) {
      return scriptToAddress(receive.lock, { isMainnet })
    }

    const sudt = outputs.find(output => {
      const address = scriptToAddress(output.lock, { isMainnet })
      return !!sUDTAccounts.find(item => item.address === address)
    })
    if (sudt) {
      return scriptToAddress(sudt.lock, { isMainnet })
    }
    return ''
  }

  const items: {
    address: string
    amount: string
    capacity: string
    isLastOutput: boolean
    output: State.DetailedOutput
  }[] = useMemo(() => {
    if (transaction && transaction.outputs.length) {
      const lastOutputAddress = getLastOutputAddress(transaction.outputs)
      return transaction.outputs.map(output => {
        const address = scriptToAddress(output.lock, { isMainnet })
        return {
          capacity: output.capacity,
          address,
          output,
          amount: shannonToCKBFormatter(output.capacity || '0'),
          isLastOutput: address === lastOutputAddress,
        }
      })
    }
    return []
  }, [transaction?.outputs])

  const outputsCapacity = useMemo(() => {
    const outputList = items.filter(item => !item.isLastOutput)
    return outputList.reduce((total, cur) => {
      return total + BigInt(cur.capacity || '0')
    }, BigInt(0))
  }, [items])

  const lastOutputsCapacity = useMemo(() => {
    if (transaction) {
      const inputsCapacity = transaction.inputs.reduce((total, cur) => {
        return total + BigInt(cur.capacity || '0')
      }, BigInt(0))

      return inputsCapacity - outputsCapacity - fee
    }
    return undefined
  }, [transaction, fee, outputsCapacity])

  return {
    items,
    lastOutputsCapacity,
  }
}

export default {
  useInitialize,
}
