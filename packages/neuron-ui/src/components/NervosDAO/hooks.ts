import { useEffect, useCallback } from 'react'
import { TFunction } from 'i18next'
import { AppActions, StateAction } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'

import {
  calculateAPC,
  ErrorCode,
  CapacityUnit,
  CONSTANTS,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  isSuccessResponse,
  validateAmount,
} from 'utils'

import {
  generateDaoWithdrawTx,
  generateDaoDepositAllTx,
  generateDaoDepositTx,
  generateDaoClaimTx,
} from 'services/remote'
import { ckbCore, getHeaderByNumber } from 'services/chain'
import { isErrorWithI18n } from 'exceptions'
import { calculateMaximumWithdraw } from '@nervosnetwork/ckb-sdk-utils'

const {
  MIN_AMOUNT,
  MILLISECONDS_IN_YEAR,
  MIN_DEPOSIT_AMOUNT,
  MEDIUM_FEE_RATE,
  SHANNON_CKB_RATIO,
  MAX_DECIMAL_DIGITS,
} = CONSTANTS
let timer: NodeJS.Timeout

const getRecordKey = ({ depositOutPoint, outPoint }: State.NervosDAORecord) => {
  return depositOutPoint ? `${depositOutPoint.txHash}-${depositOutPoint.index}` : `${outPoint.txHash}-${outPoint.index}`
}

export const useUpdateMaxDeposit = ({
  wallet,
  setMaxDepositAmount,
  setMaxDepositTx,
  setMaxDepositErrorMessage,
  isBalanceReserved,
  suggestFeeRate,
}: {
  wallet: State.Wallet
  setMaxDepositAmount: React.Dispatch<React.SetStateAction<bigint>>
  setMaxDepositTx: React.Dispatch<React.SetStateAction<any>>
  setMaxDepositErrorMessage: React.Dispatch<React.SetStateAction<string>>
  isBalanceReserved: boolean
  suggestFeeRate: number | string
}) => {
  useEffect(() => {
    generateDaoDepositAllTx({
      walletID: wallet.id,
      feeRate: `${suggestFeeRate}`,
      isBalanceReserved,
    })
      .then((res: any) => {
        if (isSuccessResponse(res)) {
          const maxValue = BigInt(res.result.outputs[0]?.capacity ?? 0)
          setMaxDepositAmount(maxValue)
          setMaxDepositTx(res.result)
          setMaxDepositErrorMessage('')
        } else {
          throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
        }
      })
      .catch((err: any) => {
        setMaxDepositAmount(BigInt(0))
        setMaxDepositTx(undefined)
        setMaxDepositErrorMessage(err.message)
      })
  }, [
    wallet.id,
    wallet.balance,
    setMaxDepositAmount,
    setMaxDepositErrorMessage,
    setMaxDepositTx,
    isBalanceReserved,
    suggestFeeRate,
  ])
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
    }, 10000)
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
  isBalanceReserved,
  t,
  suggestFeeRate,
}: {
  setDepositValue: React.Dispatch<React.SetStateAction<string>>
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  clearGeneratedTx: () => void
  maxDepositAmount: bigint
  maxDepositTx: React.Dispatch<React.SetStateAction<any>>
  dispatch: React.Dispatch<StateAction>
  walletID: string
  maxDepositErrorMessage: string
  isBalanceReserved: boolean
  t: TFunction
  suggestFeeRate: number | string
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

        try {
          validateAmount(amount)
        } catch (err) {
          if (isErrorWithI18n(err)) {
            setErrorMessage(
              t(`messages.codes.${err.code}`, { fieldName: 'deposit', fieldValue: amount, length: MAX_DECIMAL_DIGITS })
            )
          }
          return
        }

        if (BigInt(CKBToShannonFormatter(amount)) < BigInt(MIN_DEPOSIT_AMOUNT * SHANNON_CKB_RATIO)) {
          setErrorMessage(t('nervos-dao.minimal-fee-required', { minimal: MIN_DEPOSIT_AMOUNT }))
          return
        }

        const capacity = CKBToShannonFormatter(amount, CapacityUnit.CKB)
        if (BigInt(capacity) < maxDepositAmount) {
          generateDaoDepositTx({
            feeRate: `${suggestFeeRate}`,
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
          if (!isBalanceReserved) {
            setErrorMessage(maxDepositErrorMessage || t('messages.remain-ckb-for-withdraw'))
          }
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
      isBalanceReserved,
      suggestFeeRate,
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
  bestKnownBlockTimestamp,
  genesisBlockTimestamp,
  setGlobalAPC,
}: {
  bestKnownBlockTimestamp: number
  genesisBlockTimestamp: number | undefined
  setGlobalAPC: React.Dispatch<React.SetStateAction<number>>
}) =>
  useEffect(() => {
    if (bestKnownBlockTimestamp) {
      const startYearNumber = (bestKnownBlockTimestamp - +(genesisBlockTimestamp || 0)) / MILLISECONDS_IN_YEAR
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
  }, [bestKnownBlockTimestamp, genesisBlockTimestamp, setGlobalAPC])

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
  suggestFeeRate,
}: {
  activeRecord: State.NervosDAORecord | null
  setActiveRecord: React.Dispatch<null>
  clearGeneratedTx: () => void
  walletID: string
  dispatch: React.Dispatch<StateAction>
  suggestFeeRate: number | string
}) =>
  useCallback(() => {
    if (activeRecord) {
      generateDaoWithdrawTx({
        walletID,
        outPoint: activeRecord.outPoint,
        feeRate: `${suggestFeeRate}`,
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
  }, [activeRecord, setActiveRecord, clearGeneratedTx, walletID, dispatch, suggestFeeRate])

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
    if (!tipBlockHash) {
      setWithdrawList(new Map())
      return
    }
    const depositOutPointHashes = records.map(v => v.depositOutPoint?.txHash ?? v.outPoint.txHash)
    ckbCore.rpc
      .createBatchRequest<'getTransaction', string[], CKBComponents.TransactionWithStatus[]>(
        depositOutPointHashes.map(v => ['getTransaction', v])
      )
      .exec()
      .then(txs => {
        const committedTx = txs.filter(v => v.txStatus.status === 'committed')
        const blockHashes = [
          ...(committedTx.map(v => v.txStatus.blockHash).filter(v => !!v) as string[]),
          ...(records.map(v => (v.depositOutPoint ? v.blockHash : null)).filter(v => !!v) as string[]),
          tipBlockHash,
        ]
        return ckbCore.rpc
          .createBatchRequest<'getHeader', string[], CKBComponents.BlockHeader[]>(
            blockHashes.map(v => ['getHeader', v])
          )
          .exec()
          .then(blockHeaders => {
            const hashHeaderMap = new Map<CKBComponents.Hash, string>()
            blockHeaders.forEach((header, idx) => {
              hashHeaderMap.set(blockHashes[idx], header.dao)
            })
            const txMap = new Map<CKBComponents.Hash, CKBComponents.TransactionWithStatus>()
            txs.forEach((tx, idx) => {
              if (tx.txStatus.status === 'committed') {
                txMap.set(depositOutPointHashes[idx], tx)
              }
            })
            const withdrawList = new Map()
            records.forEach(record => {
              const key = getRecordKey(record)
              const withdrawBlockHash = record.depositOutPoint ? record.blockHash : tipBlockHash
              const formattedDepositOutPoint = record.depositOutPoint
                ? {
                    txHash: record.depositOutPoint.txHash,
                    index: `0x${BigInt(record.depositOutPoint.index).toString(16)}`,
                  }
                : {
                    txHash: record.outPoint.txHash,
                    index: `0x${BigInt(record.outPoint.index).toString(16)}`,
                  }
              const tx = txMap.get(formattedDepositOutPoint.txHash)
              if (!tx) {
                return
              }
              const depositDAO = hashHeaderMap.get(tx.txStatus.blockHash!)
              const withdrawDAO = hashHeaderMap.get(withdrawBlockHash)
              if (!depositDAO || !withdrawDAO) {
                return
              }
              withdrawList.set(
                key,
                calculateMaximumWithdraw(
                  tx.transaction.outputs[+formattedDepositOutPoint.index],
                  tx.transaction.outputsData[+formattedDepositOutPoint.index],
                  depositDAO,
                  withdrawDAO
                )
              )
            })
            setWithdrawList(withdrawList)
          })
      })
      .catch(() => {
        setWithdrawList(new Map())
      })
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
      const recordKeyIdxMap = new Map<string, number>()
      const batchParams: ['getHeaderByNumber', bigint][] = []
      records.forEach((record, idx) => {
        const depositBlockNumber = record.depositOutPoint
          ? ckbCore.utils.toUint64Le(record.daoData)
          : record.blockNumber
        if (depositBlockNumber) {
          batchParams.push(['getHeaderByNumber', BigInt(depositBlockNumber)])
          recordKeyIdxMap.set(getRecordKey(record), idx)
        }
      })
      ckbCore.rpc
        .createBatchRequest<'getHeaderByNumber', any, CKBComponents.BlockHeader[]>(batchParams)
        .exec()
        .then(res => {
          const epochList = new Map()
          records.forEach(record => {
            const key = getRecordKey(record)
            epochList.set(key, recordKeyIdxMap.has(key) ? res[recordKeyIdxMap.get(key)!]?.epoch : null)
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
