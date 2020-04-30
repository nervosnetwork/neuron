import { useEffect, useCallback } from 'react'
import { TFunction } from 'i18next'
import { AppActions, StateAction } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'

import { verifyAmount } from 'utils/validators'
import calculateAPC from 'utils/calculateAPC'
import isSuccessResponse from 'utils/isSuccessResponse'

import { CKBToShannonFormatter, shannonToCKBFormatter } from 'utils/formatters'
import {
  MIN_AMOUNT,
  MILLISECONDS_IN_YEAR,
  MIN_DEPOSIT_AMOUNT,
  MEDIUM_FEE_RATE,
  SHANNON_CKB_RATIO,
  MAX_DECIMAL_DIGITS,
  ErrorCode,
  CapacityUnit,
} from 'utils/const'

import {
  generateDaoWithdrawTx,
  generateDaoDepositAllTx,
  generateDaoDepositTx,
  generateDaoClaimTx,
} from 'services/remote'
import { ckbCore, getHeaderByNumber, calculateDaoMaximumWithdraw } from 'services/chain'

let timer: NodeJS.Timeout

const getRecordKey = ({ depositOutPoint, outPoint }: State.NervosDAORecord) => {
  return depositOutPoint ? `${depositOutPoint.txHash}-${depositOutPoint.index}` : `${outPoint.txHash}-${outPoint.index}`
}

export const useUpdateMaxDeposit = ({
  wallet,
  setMaxDepositAmount,
  setMaxDepositTx,
  setMaxDepositErrorMessage,
}: {
  wallet: State.Wallet
  setMaxDepositAmount: React.Dispatch<React.SetStateAction<bigint>>
  setMaxDepositTx: React.Dispatch<React.SetStateAction<any>>
  setMaxDepositErrorMessage: React.Dispatch<React.SetStateAction<string>>
}) => {
  useEffect(() => {
    generateDaoDepositAllTx({
      walletID: wallet.id,
      feeRate: `${MEDIUM_FEE_RATE}`,
    })
      .then(res => {
        if (isSuccessResponse(res)) {
          const fee = BigInt(res.result.fee)
          const maxValue = fee < BigInt(wallet.balance) ? BigInt(wallet.balance) - fee : BigInt(0)
          setMaxDepositAmount(maxValue)
          setMaxDepositTx(res.result)
          setMaxDepositErrorMessage('')
        } else {
          throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
        }
      })
      .catch(err => {
        setMaxDepositAmount(BigInt(0))
        setMaxDepositTx(undefined)
        setMaxDepositErrorMessage(err.message)
      })
  }, [wallet.id, wallet.balance, setMaxDepositAmount, setMaxDepositErrorMessage, setMaxDepositTx])
}

export const useInitData = ({
  clearGeneratedTx,
  dispatch,
  updateDepositValue,
  wallet,
  setGenesisBlockTimestamp,
}: {
  clearGeneratedTx: () => void
  dispatch: React.Dispatch<StateAction>
  updateDepositValue: (value: string) => void
  wallet: State.Wallet
  setGenesisBlockTimestamp: React.Dispatch<React.SetStateAction<number | undefined>>
}) =>
  useEffect(() => {
    updateNervosDaoData({ walletID: wallet.id })(dispatch)
    const intervalId = setInterval(() => {
      updateNervosDaoData({ walletID: wallet.id })(dispatch)
    }, 3000)
    updateDepositValue(
      `${
        BigInt(wallet.balance) > BigInt(CKBToShannonFormatter(`${MIN_DEPOSIT_AMOUNT}`))
          ? BigInt(MIN_DEPOSIT_AMOUNT)
          : BigInt(0)
      }`
    )
    getHeaderByNumber('0x0')
      .then(header => setGenesisBlockTimestamp(+header.timestamp))
      .catch(err => console.error(err))
    return () => {
      clearInterval(intervalId)
      clearNervosDaoData()(dispatch)
      clearGeneratedTx()
    }
    // eslint-disable-next-line
  }, [])

export const useClearGeneratedTx = (dispatch: React.Dispatch<StateAction>) =>
  useCallback(() => {
    dispatch({
      type: AppActions.ClearSendState,
    })
  }, [dispatch])

export const useUpdateDepositValue = ({
  setDepositValue,
  setErrorMessage,
  clearGeneratedTx,
  maxDepositAmount,
  maxDepositTx,
  dispatch,
  walletID,
  maxDepositErrorMessage,
  t,
}: {
  setDepositValue: React.Dispatch<React.SetStateAction<string>>
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  clearGeneratedTx: () => void
  maxDepositAmount: bigint
  maxDepositTx: React.Dispatch<React.SetStateAction<any>>
  dispatch: React.Dispatch<StateAction>
  walletID: string
  maxDepositErrorMessage: string
  t: TFunction
}) =>
  useCallback(
    (value: string) => {
      const amount = value.replace(/,/g, '')
      if (Number.isNaN(+amount) || /[^\d.]/.test(amount) || +amount < 0) {
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        setErrorMessage('')
        clearGeneratedTx()

        const verifyRes = verifyAmount(amount)
        if (verifyRes !== true) {
          setErrorMessage(t(`messages.codes.${verifyRes.code}`, { fieldName: 'deposit', length: MAX_DECIMAL_DIGITS }))
          return
        }

        if (BigInt(CKBToShannonFormatter(amount)) < BigInt(MIN_DEPOSIT_AMOUNT * SHANNON_CKB_RATIO)) {
          setErrorMessage(t('nervos-dao.minimal-fee-required', { minimal: MIN_DEPOSIT_AMOUNT }))
          return
        }

        const capacity = CKBToShannonFormatter(amount, CapacityUnit.CKB)
        if (BigInt(capacity) < maxDepositAmount) {
          generateDaoDepositTx({
            feeRate: `${MEDIUM_FEE_RATE}`,
            capacity,
            walletID,
          }).then(res => {
            if (isSuccessResponse(res)) {
              dispatch({
                type: AppActions.UpdateGeneratedTx,
                payload: res.result,
              })
            } else if (res.status === 0) {
              setErrorMessage(`${typeof res.message === 'string' ? res.message : res.message.content}`)
            } else if (res.status === ErrorCode.CapacityNotEnoughForChange) {
              setErrorMessage(t(`messages.codes.106`))
            } else {
              setErrorMessage(t(`messages.codes.${res.status}`))
            }
          })
        } else if (BigInt(capacity) === maxDepositAmount) {
          dispatch({
            type: AppActions.UpdateGeneratedTx,
            payload: maxDepositTx,
          })
          setErrorMessage(maxDepositErrorMessage || t('messages.remain-ckb-for-withdraw'))
        } else {
          setErrorMessage(t(`messages.codes.${ErrorCode.AmountNotEnough}`))
        }
      }, 500)
      setDepositValue(amount)
    },
    [
      clearGeneratedTx,
      maxDepositAmount,
      maxDepositTx,
      dispatch,
      walletID,
      maxDepositErrorMessage,
      t,
      setDepositValue,
      setErrorMessage,
    ]
  )

export const useOnDepositValueChange = ({ updateDepositValue }: { updateDepositValue: (value: string) => void }) =>
  useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      updateDepositValue(value)
    },
    [updateDepositValue]
  )

export const useUpdateGlobalAPC = ({
  tipBlockTimestamp,
  genesisBlockTimestamp,
  setGlobalAPC,
}: {
  tipBlockTimestamp: number
  genesisBlockTimestamp: number | undefined
  setGlobalAPC: React.Dispatch<React.SetStateAction<number>>
}) =>
  useEffect(() => {
    if (tipBlockTimestamp) {
      const startYearNumber = (tipBlockTimestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
      try {
        const apc = calculateAPC({
          startYearNumber,
          endYearNumber: startYearNumber + 1,
        })
        setGlobalAPC(apc)
      } catch (err) {
        console.error(err)
      }
    }
  }, [tipBlockTimestamp, genesisBlockTimestamp, setGlobalAPC])

export const useOnDepositDialogDismiss = ({
  setShowDepositDialog,
  setDepositValue,
  setErrorMessage,
}: {
  setShowDepositDialog: React.Dispatch<React.SetStateAction<boolean>>
  setDepositValue: React.Dispatch<React.SetStateAction<string>>
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
}) =>
  useCallback(() => {
    setShowDepositDialog(false)
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    setErrorMessage('')
  }, [setShowDepositDialog, setDepositValue, setErrorMessage])

export const useOnDepositDialogSubmit = ({
  setShowDepositDialog,
  setDepositValue,
  dispatch,
  walletID,
}: {
  setShowDepositDialog: React.Dispatch<React.SetStateAction<boolean>>
  setDepositValue: React.Dispatch<React.SetStateAction<string>>
  dispatch: React.Dispatch<StateAction>
  walletID: string
}) =>
  useCallback(() => {
    setShowDepositDialog(false)
    setDepositValue(`${MIN_DEPOSIT_AMOUNT}`)
    dispatch({
      type: AppActions.RequestPassword,
      payload: {
        walletID,
        actionType: 'send',
      },
    })
  }, [setShowDepositDialog, setDepositValue, dispatch, walletID])

export const useOnWithdrawDialogDismiss = (setActiveRecord: React.Dispatch<null>) =>
  useCallback(() => {
    setActiveRecord(null)
  }, [setActiveRecord])

export const useOnWithdrawDialogSubmit = ({
  activeRecord,
  setActiveRecord,
  clearGeneratedTx,
  walletID,
  dispatch,
}: {
  activeRecord: State.NervosDAORecord | null
  setActiveRecord: React.Dispatch<null>
  clearGeneratedTx: () => void
  walletID: string
  dispatch: React.Dispatch<StateAction>
}) =>
  useCallback(() => {
    if (activeRecord) {
      generateDaoWithdrawTx({
        walletID,
        outPoint: activeRecord.outPoint,
        feeRate: `${MEDIUM_FEE_RATE}`,
      })
        .then(res => {
          if (isSuccessResponse(res)) {
            dispatch({
              type: AppActions.UpdateGeneratedTx,
              payload: res.result,
            })
            dispatch({
              type: AppActions.RequestPassword,
              payload: {
                walletID,
                actionType: 'send',
              },
            })
          } else {
            clearGeneratedTx()
            throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
          }
        })
        .catch((err: Error) => {
          dispatch({
            type: AppActions.AddNotification,
            payload: {
              type: 'alert',
              timestamp: +new Date(),
              content: err.message,
            },
          })
        })
    }
    setActiveRecord(null)
  }, [activeRecord, setActiveRecord, clearGeneratedTx, walletID, dispatch])

export const useOnActionClick = ({
  records,
  clearGeneratedTx,
  dispatch,
  walletID,
  setActiveRecord,
}: {
  records: Readonly<State.NervosDAORecord[]>
  clearGeneratedTx: () => void
  dispatch: React.Dispatch<StateAction>
  walletID: string
  setActiveRecord: React.Dispatch<State.NervosDAORecord>
}) =>
  useCallback(
    (e: any) => {
      const { dataset } = e.target
      const outPoint = {
        txHash: dataset.txHash,
        index: dataset.index,
      }
      const record = records.find(r => r.outPoint.txHash === outPoint.txHash && r.outPoint.index === outPoint.index)
      if (record) {
        if (record.depositOutPoint) {
          generateDaoClaimTx({
            walletID,
            withdrawingOutPoint: record.outPoint,
            depositOutPoint: record.depositOutPoint,
            feeRate: `${MEDIUM_FEE_RATE}`,
          })
            .then(res => {
              if (isSuccessResponse(res)) {
                dispatch({
                  type: AppActions.UpdateGeneratedTx,
                  payload: res.result,
                })
                dispatch({
                  type: AppActions.RequestPassword,
                  payload: {
                    walletID,
                    actionType: 'send',
                  },
                })
              } else {
                clearGeneratedTx()
                throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
              }
            })
            .catch((err: Error) => {
              dispatch({
                type: AppActions.AddNotification,
                payload: {
                  type: 'alert',
                  timestamp: +new Date(),
                  content: err.message,
                },
              })
            })
        } else {
          setActiveRecord(record)
        }
      }
    },
    [records, clearGeneratedTx, dispatch, walletID, setActiveRecord]
  )

export const useOnSlide = ({
  updateDepositValue,
  maxDepositAmount,
}: {
  updateDepositValue: (value: string) => void
  maxDepositAmount: bigint
}) =>
  useCallback(
    (value: number) => {
      const amount =
        maxDepositAmount - BigInt(CKBToShannonFormatter(`${value}`)) < BigInt(SHANNON_CKB_RATIO * MIN_AMOUNT)
          ? shannonToCKBFormatter(`${maxDepositAmount}`, false, '')
          : `${value}`
      updateDepositValue(amount)
    },
    [updateDepositValue, maxDepositAmount]
  )

export const useUpdateWithdrawList = ({
  records,
  tipBlockHash,
  setWithdrawList,
}: {
  records: Readonly<State.NervosDAORecord[]>
  tipBlockHash: string
  setWithdrawList: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
}) =>
  useEffect(() => {
    Promise.all(
      records.map(async ({ outPoint, depositOutPoint, blockHash }) => {
        if (!tipBlockHash) {
          return null
        }
        const withdrawBlockHash = depositOutPoint ? blockHash : tipBlockHash
        const formattedDepositOutPoint = depositOutPoint
          ? {
              txHash: depositOutPoint.txHash,
              index: `0x${BigInt(depositOutPoint.index).toString(16)}`,
            }
          : {
              txHash: outPoint.txHash,
              index: `0x${BigInt(outPoint.index).toString(16)}`,
            }
        return calculateDaoMaximumWithdraw(formattedDepositOutPoint, withdrawBlockHash).catch(() => null)
      })
    )
      .then(res => {
        const withdrawList = new Map()
        if (tipBlockHash) {
          records.forEach((record, idx) => {
            const key = getRecordKey(record)
            withdrawList.set(key, res[idx])
          })
        }
        setWithdrawList(withdrawList)
      })
      .catch(console.error)
  }, [records, tipBlockHash, setWithdrawList])

export const useUpdateDepositEpochList = ({
  records,
  setDepositEpochList,
  connectionStatus,
}: {
  records: Readonly<State.NervosDAORecord[]>
  setDepositEpochList: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
  connectionStatus: State.ConnectionStatus
}) =>
  useEffect(() => {
    if (connectionStatus === 'online') {
      Promise.all(
        records.map(({ daoData, depositOutPoint, blockNumber }) => {
          const depositBlockNumber = depositOutPoint ? ckbCore.utils.toHexInLittleEndian(daoData) : blockNumber
          if (!depositBlockNumber) {
            return null
          }
          return getHeaderByNumber(BigInt(depositBlockNumber))
            .then(header => header.epoch)
            .catch(() => null)
        })
      ).then(res => {
        const epochList = new Map()
        records.forEach((record, idx) => {
          const key = getRecordKey(record)
          epochList.set(key, res[idx])
        })
        setDepositEpochList(epochList)
      })
    }
  }, [records, setDepositEpochList, connectionStatus])

export default {
  useInitData,
  useUpdateGlobalAPC,
  useUpdateMaxDeposit,
  useClearGeneratedTx,
  useUpdateDepositValue,
  useOnDepositValueChange,
  useOnDepositDialogDismiss,
  useOnDepositDialogSubmit,
  useOnWithdrawDialogDismiss,
  useOnWithdrawDialogSubmit,
  useOnActionClick,
  useOnSlide,
  useUpdateWithdrawList,
  useUpdateDepositEpochList,
}
