import { useEffect, useCallback } from 'react'
import { AppActions, StateAction } from 'states/stateProvider/reducer'
import { showGlobalAlertDialog } from 'states/stateProvider/actionCreators'

import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import { isSuccessResponse, getExplorerUrl } from 'utils'

import { rpc } from 'services/chain'
import {
  MultisigConfig,
  generateMultisigDaoWithdrawTx,
  generateMultisigDaoClaimTx,
  openExternal,
} from 'services/remote'
import { calculateMaximumWithdrawCompatible } from '@ckb-lumos/lumos/common-scripts/dao'

const getRecordKey = ({ depositOutPoint, outPoint }: State.NervosDAORecord) => {
  return depositOutPoint ? `${depositOutPoint.txHash}-${depositOutPoint.index}` : `${outPoint.txHash}-${outPoint.index}`
}

export const useOnWithdrawDialogDismiss = (setActiveRecord: React.Dispatch<null>) =>
  useCallback(() => {
    setActiveRecord(null)
  }, [setActiveRecord])

export const useGenerateDaoWithdrawTx = ({
  activeRecord,
  setActiveRecord,
  clearGeneratedTx,
  walletID,
  dispatch,
  suggestFeeRate,
  multisigConfig,
}: {
  activeRecord: State.NervosDAORecord | null
  setActiveRecord: React.Dispatch<null>
  clearGeneratedTx: () => void
  walletID: string
  dispatch: React.Dispatch<StateAction>
  suggestFeeRate: number | string
  multisigConfig: MultisigConfig
}) =>
  useCallback(() => {
    if (activeRecord) {
      generateMultisigDaoWithdrawTx({
        outPoint: activeRecord.outPoint,
        feeRate: `${suggestFeeRate}`,
        multisigConfig,
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
                actionType: multisigConfig.m === 1 ? 'send-from-multisig-need-one' : 'send-from-multisig',
                multisigConfig,
                onSuccess: () => {},
                title: 'password-request.verify-password',
              },
            })
          } else {
            clearGeneratedTx()
            throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
          }
        })
        .catch((err: Error) => {
          showGlobalAlertDialog({
            type: 'failed',
            message: err.message,
            action: 'ok',
          })(dispatch)
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
  isMainnet,
  multisigConfig,
  suggestFeeRate,
}: {
  records: Readonly<State.NervosDAORecord[]>
  clearGeneratedTx: () => void
  dispatch: React.Dispatch<StateAction>
  walletID: string
  setActiveRecord: React.Dispatch<State.NervosDAORecord>
  isMainnet: boolean
  multisigConfig: MultisigConfig
  suggestFeeRate: number | string
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
          openExternal(`${getExplorerUrl(isMainnet)}/transaction/${record?.depositInfo?.txHash}`)
        } else if (record.depositOutPoint) {
          generateMultisigDaoClaimTx({
            withdrawingOutPoint: record.outPoint,
            depositOutPoint: record.depositOutPoint,
            feeRate: `${suggestFeeRate}`,
            multisigConfig,
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
                    actionType: multisigConfig.m === 1 ? 'send-from-multisig-need-one' : 'send-from-multisig',
                    multisigConfig,
                    onSuccess: () => {},
                    title: 'password-request.verify-password',
                  },
                })
              } else {
                clearGeneratedTx()
                throw new Error(`${typeof res.message === 'string' ? res.message : res.message.content}`)
              }
            })
            .catch((err: Error) => {
              showGlobalAlertDialog({
                type: 'failed',
                message: err.message,
                action: 'ok',
              })(dispatch)
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
  useOnWithdrawDialogDismiss,
  useGenerateDaoWithdrawTx,
  useOnActionClick,
  useUpdateWithdrawList,
  useUpdateDepositEpochList,
}
