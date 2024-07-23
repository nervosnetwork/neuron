import { useEffect, useCallback, useState } from 'react'
import { AppActions, StateAction } from 'states/stateProvider/reducer'
import { updateNervosDaoData, clearNervosDaoData } from 'states/stateProvider/actionCreators'

import { NavigateFunction } from 'react-router-dom'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import { calculateAPC, CONSTANTS, isSuccessResponse, RoutePath } from 'utils'

import { rpc, getHeader } from 'services/chain'
import { generateDaoWithdrawTx, generateDaoClaimTx } from 'services/remote'
import { calculateMaximumWithdrawCompatible } from '@ckb-lumos/lumos/common-scripts/dao'

const { MILLISECONDS_IN_YEAR, MEDIUM_FEE_RATE } = CONSTANTS

const getRecordKey = ({ depositOutPoint, outPoint }: State.NervosDAORecord) => {
  return depositOutPoint ? `${depositOutPoint.txHash}-${depositOutPoint.index}` : `${outPoint.txHash}-${outPoint.index}`
}

export const useInitData = ({
  clearGeneratedTx,
  dispatch,
  wallet,
  setGenesisBlockTimestamp,
  genesisBlockHash,
}: {
  clearGeneratedTx: () => void
  dispatch: React.Dispatch<StateAction>
  wallet: State.Wallet
  setGenesisBlockTimestamp: React.Dispatch<React.SetStateAction<number | undefined>>
  genesisBlockHash?: string
}) =>
  useEffect(() => {
    updateNervosDaoData({ walletID: wallet.id })(dispatch)
    const intervalId = setInterval(() => {
      updateNervosDaoData({ walletID: wallet.id })(dispatch)
    }, 10000)
    if (genesisBlockHash) {
      getHeader(genesisBlockHash)
        .then(header => setGenesisBlockTimestamp(+header.timestamp))
        .catch(err => console.error(err))
    }
    return () => {
      clearInterval(intervalId)
      clearNervosDaoData()(dispatch)
      clearGeneratedTx()
    }
    // eslint-disable-next-line
  }, [])

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

export const useDepositDialog = () => {
  const [showDepositDialog, setShowDepositDialog] = useState(false)
  const onOpenDepositDialog = useCallback(() => {
    setShowDepositDialog(true)
  }, [])
  const onCloseDepositDialog = useCallback(() => {
    setShowDepositDialog(false)
  }, [])
  return {
    showDepositDialog,
    onOpenDepositDialog,
    onCloseDepositDialog,
  }
}

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
                onSuccess: () => {},
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
  navigate,
}: {
  records: Readonly<State.NervosDAORecord[]>
  clearGeneratedTx: () => void
  dispatch: React.Dispatch<StateAction>
  walletID: string
  setActiveRecord: React.Dispatch<State.NervosDAORecord>
  navigate: NavigateFunction
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
        if (record.status === 'sent') {
          navigate(`${RoutePath.History}/${record.depositInfo?.txHash}`)
        } else if (record.depositOutPoint) {
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
                    onSuccess: () => {},
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

export const useUpdateWithdrawList = ({
  records,
  tipDao,
  setWithdrawList,
}: {
  records: Readonly<State.NervosDAORecord[]>
  tipDao?: string
  setWithdrawList: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
}) =>
  useEffect(() => {
    if (!tipDao) {
      setWithdrawList(new Map())
      return
    }
    const depositOutPointHashes = records.map(v => v.depositOutPoint?.txHash ?? v.outPoint.txHash)
    rpc
      .createBatchRequest<'getTransaction', string[], CKBComponents.TransactionWithStatus[]>(
        depositOutPointHashes.map(v => ['getTransaction', v])
      )
      .exec()
      .then((txs: CKBComponents.TransactionWithStatus[]) => {
        const committedTx = txs.filter(v => v.txStatus.status === 'committed')
        const blockHashes = [
          ...(committedTx.map(v => v.txStatus.blockHash).filter(v => !!v) as string[]),
          ...(records.map(v => (v.depositOutPoint ? v.blockHash : null)).filter(v => !!v) as string[]),
        ]
        return rpc
          .createBatchRequest<'getHeader', string[], CKBComponents.BlockHeader[]>(
            blockHashes.map(v => ['getHeader', v])
          )
          .exec()
          .then((blockHeaders: CKBComponents.BlockHeader[]) => {
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
              const withdrawBlockHash = record.depositOutPoint ? record.blockHash : undefined
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
              const withdrawDAO = withdrawBlockHash ? hashHeaderMap.get(withdrawBlockHash) : tipDao
              if (!depositDAO || !withdrawDAO) {
                return
              }
              withdrawList.set(
                key,
                calculateMaximumWithdrawCompatible(
                  {
                    cellOutput: tx.transaction.outputs[+formattedDepositOutPoint.index],
                    data: tx.transaction.outputsData[+formattedDepositOutPoint.index],
                  },
                  depositDAO,
                  withdrawDAO
                ).toHexString()
              )
            })
            setWithdrawList(withdrawList)
          })
      })
      .catch(() => {
        setWithdrawList(new Map())
      })
  }, [records, tipDao, setWithdrawList])

const getBlockHashes = (txHashes: string[]) => {
  const batchParams: ['getTransaction', string][] = txHashes.map(v => ['getTransaction', v])
  return rpc
    .createBatchRequest<'getTransaction', [string], CKBComponents.TransactionWithStatus[]>(batchParams)
    .exec()
    .then((res: CKBComponents.TransactionWithStatus[]) => {
      return res.map((v, idx) => ({
        txHash: txHashes[idx],
        blockHash: v.txStatus.blockHash,
      }))
    })
    .catch(() => {
      return []
    })
}

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
      getBlockHashes(records.map(v => v.depositOutPoint?.txHash).filter(v => !!v) as string[]).then(
        (depositBlockHashes: { txHash: string; blockHash: string | undefined }[]) => {
          const recordKeyIdx: string[] = []
          const batchParams: ['getHeader', string][] = []
          records.forEach(record => {
            if (!record.depositOutPoint && record.blockHash) {
              batchParams.push(['getHeader', record.blockHash])
              recordKeyIdx.push(record.outPoint.txHash)
            }
          })
          depositBlockHashes.forEach(v => {
            if (v.blockHash) {
              batchParams.push(['getHeader', v.blockHash])
              recordKeyIdx.push(v.txHash)
            }
          })
          rpc
            .createBatchRequest<'getHeader', any, CKBComponents.BlockHeader[]>(batchParams)
            .exec()
            .then((res: CKBComponents.BlockHeader[]) => {
              const epochList = new Map()
              records.forEach(record => {
                const key = record.depositOutPoint ? record.depositOutPoint.txHash : record.outPoint.txHash
                epochList.set(key, res[recordKeyIdx.indexOf(key)]?.epoch)
              })
              setDepositEpochList(epochList)
            })
            .catch(() => {
              setDepositEpochList(new Map())
            })
        }
      )
    }
  }, [records, setDepositEpochList, connectionStatus])

export default {
  useInitData,
  useUpdateGlobalAPC,
  useOnDepositValueChange,
  useOnWithdrawDialogDismiss,
  useOnWithdrawDialogSubmit,
  useOnActionClick,
  useUpdateWithdrawList,
  useUpdateDepositEpochList,
}
