import { isErrorWithI18n } from 'exceptions'
import { TFunction } from 'i18next'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  generateDaoDepositAllTx as generateDaoDepositAllTxAPI,
  generateDaoDepositTx as generateDaoDepositTxAPI,
} from 'services/remote'
import { AppActions, useDispatch } from 'states'
import {
  CKBToShannonFormatter,
  ErrorCode,
  ResponseCode,
  isSuccessResponse,
  padFractionDigitsIfDecimal,
  shannonToCKBFormatter,
  useClearGeneratedTx,
  validateAmount,
} from 'utils'
import { MAX_DECIMAL_DIGITS, MIN_DEPOSIT_AMOUNT, SHANNON_CKB_RATIO } from 'utils/const'

const PERCENT_100 = 100

function checkDepositValue(depositValue: string, t: TFunction): string | undefined {
  try {
    validateAmount(depositValue)
  } catch (err) {
    if (isErrorWithI18n(err)) {
      return t(`messages.codes.${err.code}`, {
        fieldName: 'deposit',
        fieldValue: depositValue,
        length: MAX_DECIMAL_DIGITS,
      })
    }
    return undefined
  }
  if (BigInt(CKBToShannonFormatter(depositValue)) < BigInt(MIN_DEPOSIT_AMOUNT * SHANNON_CKB_RATIO)) {
    return t('nervos-dao.minimal-fee-required', { minimal: MIN_DEPOSIT_AMOUNT })
  }
  return undefined
}

function generateDaoDepositTx({
  walletID,
  capacity,
  suggestFeeRate,
  t,
}: {
  walletID: string
  capacity: string
  suggestFeeRate: number
  t: TFunction
}): Promise<State.GeneratedTx | null> {
  return generateDaoDepositTxAPI({
    feeRate: `${suggestFeeRate}`,
    capacity,
    walletID,
  }).then(res => {
    if (isSuccessResponse(res)) {
      return res.result
    }
    if (res.status === ResponseCode.FAILURE) {
      throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
    } else if (res.status === ErrorCode.CapacityNotEnoughForChange) {
      throw new Error(t(`messages.codes.106`))
    } else {
      throw new Error(t(`messages.codes.${res.status}`))
    }
  })
}

function generateDaoDepositAllTx({
  suggestFeeRate,
  isBalanceReserved,
  walletID,
}: {
  suggestFeeRate: number
  isBalanceReserved: boolean
  walletID: string
}): Promise<State.GeneratedTx | null> {
  return generateDaoDepositAllTxAPI({
    walletID,
    feeRate: `${suggestFeeRate}`,
    isBalanceReserved,
  }).then(res => {
    if (isSuccessResponse(res)) {
      return res.result
    }
    throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
  })
}

export const useGenerateDaoDepositTx = ({
  walletID,
  isBalanceReserved,
  depositValue,
  suggestFeeRate,
  showDepositDialog,
  slidePercent,
}: {
  walletID: string
  isBalanceReserved: boolean
  depositValue: string
  suggestFeeRate: number
  showDepositDialog: boolean
  slidePercent: number
}) => {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [errorMessage, setErrorMessage] = useState('')
  const [maxDepositValue, setMaxDepositValue] = useState<string | undefined>()
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const clearGeneratedTx = useClearGeneratedTx()
  const isDepositAll = useMemo(() => slidePercent === PERCENT_100, [slidePercent])
  useEffect(() => {
    clearTimeout(timer.current)
    if (!showDepositDialog) {
      return
    }
    timer.current = setTimeout(() => {
      setErrorMessage('')
      const errorDepositValue = checkDepositValue(depositValue, t)
      if (errorDepositValue) {
        clearGeneratedTx()
        setErrorMessage(errorDepositValue)
        return
      }

      const generateDaoDepositResult: Promise<State.GeneratedTx | null> = isDepositAll
        ? generateDaoDepositAllTx({ walletID, isBalanceReserved, suggestFeeRate })
        : generateDaoDepositTx({ walletID, capacity: CKBToShannonFormatter(depositValue), suggestFeeRate, t })
      generateDaoDepositResult
        .then(res => {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: res,
          })
          if (isDepositAll) {
            setMaxDepositValue(shannonToCKBFormatter(res?.outputs[0]?.capacity ?? '0', false, ''))
            if (!isBalanceReserved) {
              setErrorMessage(t('messages.remain-ckb-for-withdraw'))
            }
          }
        })
        .catch((err: unknown) => {
          clearGeneratedTx()
          setErrorMessage(err instanceof Error ? err.message : '')
        })
    })
  }, [
    clearGeneratedTx,
    dispatch,
    walletID,
    t,
    setErrorMessage,
    isBalanceReserved,
    depositValue,
    suggestFeeRate,
    showDepositDialog,
    isDepositAll,
  ])
  return {
    errorMessage,
    maxDepositValue: isDepositAll ? maxDepositValue ?? depositValue : null,
  }
}

function calculatePercent(amount: string, total: string) {
  if (!total || total === '0') return 0
  return +((BigInt(PERCENT_100) * BigInt(amount)) / BigInt(total)).toString()
}

export const useDepositValue = (balance: string, showDepositDialog: boolean) => {
  const [depositValue, setDepositValue] = useState(`${MIN_DEPOSIT_AMOUNT}`)
  const [slidePercent, setSlidePercent] = useState(
    calculatePercent(CKBToShannonFormatter(`${MIN_DEPOSIT_AMOUNT}`), balance)
  )
  const onSliderChange = useCallback(
    (percent: number) => {
      setSlidePercent(percent)
      const amount = shannonToCKBFormatter(
        ((BigInt(percent) * BigInt(balance)) / BigInt(PERCENT_100)).toString(),
        false,
        ''
      )
      setDepositValue(padFractionDigitsIfDecimal(amount, 8))
    },
    [balance]
  )
  const onChangeDepositValue = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget
      const amount = value.replace(/,/g, '')
      if (Number.isNaN(+amount) || /[^\d.]/.test(amount) || +amount < 0) {
        return
      }
      setDepositValue(amount)
      try {
        validateAmount(amount)
        const percent = calculatePercent(CKBToShannonFormatter(amount), balance)
        setSlidePercent(percent >= PERCENT_100 ? 100 : percent)
      } catch (error) {
        // here we can ignore the error, it used to verify amount and set slide percent
      }
    },
    [setDepositValue, balance]
  )
  const resetDepositValue = useCallback(() => {
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    setSlidePercent(calculatePercent(CKBToShannonFormatter(`${MIN_DEPOSIT_AMOUNT}`), balance))
  }, [balance])
  useEffect(() => {
    if (showDepositDialog) {
      resetDepositValue()
    }
    // ignore resetDepositValue changed, only showDepositDialog from false -> true reset
  }, [showDepositDialog])
  return {
    onChangeDepositValue,
    setDepositValue,
    depositValue,
    slidePercent,
    onSliderChange,
    resetDepositValue,
  }
}

export const useBalanceReserved = () => {
  const [isBalanceReserved, setIsBalanceReserved] = useState(true)
  const onIsBalanceReservedChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setIsBalanceReserved(!e.currentTarget.checked)
  }
  return {
    isBalanceReserved,
    onIsBalanceReservedChange,
    setIsBalanceReserved,
  }
}

export const useOnDepositDialogSubmit = ({
  onCloseDepositDialog,
  walletID,
}: {
  onCloseDepositDialog: () => void
  walletID: string
}) => {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch({
      type: AppActions.RequestPassword,
      payload: {
        walletID,
        actionType: 'send',
      },
    })
    onCloseDepositDialog()
  }, [dispatch, walletID, onCloseDepositDialog])
}

export const useOnDepositDialogCancel = ({
  onCloseDepositDialog,
  resetDepositValue,
  setIsBalanceReserved,
}: {
  onCloseDepositDialog: () => void
  resetDepositValue: () => void
  setIsBalanceReserved: Dispatch<SetStateAction<boolean>>
}) => {
  const dispatch = useDispatch()
  const clearGeneratedTx = useClearGeneratedTx()
  return useCallback(() => {
    onCloseDepositDialog()
    resetDepositValue()
    setIsBalanceReserved(true)
    clearGeneratedTx()
  }, [dispatch, onCloseDepositDialog, resetDepositValue, clearGeneratedTx])
}
