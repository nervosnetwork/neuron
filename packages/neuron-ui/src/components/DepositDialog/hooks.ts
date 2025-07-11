import { isErrorWithI18n } from 'exceptions'
import { TFunction } from 'i18next'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MultisigConfig,
  generateDaoDepositAllTx as generateDaoDepositAllTxAPI,
  generateDaoDepositTx as generateDaoDepositTxAPI,
  generateMultisigDaoDepositTx as generateMultisigDaoDepositTxAPI,
  generateMultisigDaoDepositAllTx as generateMultisigDaoDepositAllTxAPI,
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
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
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
  multisigConfig,
}: {
  walletID: string
  capacity: string
  suggestFeeRate: number
  t: TFunction
  multisigConfig?: MultisigConfig
}): Promise<State.GeneratedTx | null> {
  const generateCall = multisigConfig
    ? generateMultisigDaoDepositTxAPI({
        feeRate: `${suggestFeeRate}`,
        capacity,
        multisigConfig,
      })
    : generateDaoDepositTxAPI({
        walletID,
        feeRate: `${suggestFeeRate}`,
        capacity,
      })
  return generateCall.then(res => {
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
  multisigConfig,
}: {
  suggestFeeRate: number
  isBalanceReserved: boolean
  walletID: string
  multisigConfig?: MultisigConfig
}): Promise<State.GeneratedTx | null> {
  const generateAllCall = multisigConfig
    ? generateMultisigDaoDepositAllTxAPI({
        feeRate: `${suggestFeeRate}`,
        isBalanceReserved,
        multisigConfig,
      })
    : generateDaoDepositAllTxAPI({
        walletID,
        feeRate: `${suggestFeeRate}`,
        isBalanceReserved,
      })
  return generateAllCall.then(res => {
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
  multisigConfig,
}: {
  walletID: string
  isBalanceReserved: boolean
  depositValue: string
  suggestFeeRate: number
  showDepositDialog: boolean
  slidePercent: number
  multisigConfig?: MultisigConfig
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
        ? generateDaoDepositAllTx({ walletID, isBalanceReserved, suggestFeeRate, multisigConfig })
        : generateDaoDepositTx({
            walletID,
            capacity: CKBToShannonFormatter(depositValue),
            suggestFeeRate,
            t,
            multisigConfig,
          })
      generateDaoDepositResult
        .then(res => {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: res,
          })
          if (isDepositAll) {
            setMaxDepositValue(shannonToCKBFormatter(res?.outputs[0]?.capacity ?? '0', false, false))
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
        false
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
  onDepositSuccess,
  wallet,
  multisigConfig,
}: {
  onDepositSuccess: () => void
  wallet: State.Wallet
  multisigConfig?: MultisigConfig
}) => {
  const dispatch = useDispatch()
  return useCallback(() => {
    if (multisigConfig) {
      const { canBroadcastAfterSign } = getMultisigSignStatus({ multisigConfig, addresses: wallet.addresses })
      dispatch({
        type: AppActions.RequestPassword,
        payload: {
          walletID: wallet.id,
          actionType: canBroadcastAfterSign ? 'send-from-multisig-need-one' : 'send-from-multisig',
          multisigConfig,
          onSuccess: onDepositSuccess,
          title: 'password-request.verify-password',
        },
      })
    } else {
      dispatch({
        type: AppActions.RequestPassword,
        payload: {
          walletID: wallet.id,
          actionType: 'send',
          onSuccess: onDepositSuccess,
        },
      })
    }
  }, [dispatch, wallet.id, onDepositSuccess, multisigConfig])
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

export const useDepositRewards = ({
  depositValue,
  maxDepositValue,
  disabled,
  globalAPC,
}: {
  depositValue: string
  maxDepositValue: string | null
  disabled: boolean
  globalAPC: number
}) => {
  const [annualRewards, monthRewards] = useMemo(() => {
    if (disabled) return ['0', '0']

    const value = CKBToShannonFormatter(
      (Number(maxDepositValue || depositValue) - MIN_DEPOSIT_AMOUNT).toFixed(MAX_DECIMAL_DIGITS).toString()
    )

    const dpc = globalAPC / 365 / 100

    const mRewards = (Number(value) * dpc * 30).toFixed(0).toString()

    const rewerds = (Number(value) * dpc * 360).toFixed(0).toString()

    return [rewerds, mRewards]
  }, [depositValue, maxDepositValue, disabled, globalAPC])

  return {
    annualRewards,
    monthRewards,
  }
}
