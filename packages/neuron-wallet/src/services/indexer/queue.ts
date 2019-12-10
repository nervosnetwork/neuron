import { Subject, Subscription } from 'rxjs'
import {  AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import ArrayUtils from 'utils/array'
import logger from 'utils/logger'
import GetBlocks from 'services/sync/get-blocks'
import NetworksService from 'services/networks'
import { Transaction, TransactionWithStatus } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import BlockNumber from 'services/sync/block-number'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import LockUtils from 'models/lock-utils'
import TransactionPersistor from 'services/tx/transaction-persistor'
import IndexerTransaction from 'services/tx/indexer-transaction'

import IndexerRPC from './indexer-rpc'
import HexUtils from 'utils/hex'
import { TxUniqueFlagCache } from './tx-unique-flag'
import { TransactionCache } from './transaction-cache'
import TransactionEntity from 'database/chain/entities/transaction'
import DaoUtils from 'models/dao-utils'
import CommonUtils from 'utils/common'

export interface LockHashInfo {
  lockHash: string
  isImporting: boolean | undefined
}

enum TxPointType {
  CreatedBy = 'createdBy',
  ConsumedBy = 'consumedBy',
}

export default class IndexerQueue {
  private lockHashInfos: LockHashInfo[]
  private indexerRPC: IndexerRPC
  private getBlocksService: GetBlocks
  private per = 50
  private interval = 1000
  private blockNumberService: BlockNumber
  private tipNumberListener: Subscription
  private tipBlockNumber: bigint = BigInt(-1)

  private stopped = false
  private indexed = false

  private inProcess = false

  private resetFlag = false

  private latestCreatedBy: TxUniqueFlagCache = new TxUniqueFlagCache(100)
  private txCache: TransactionCache = new TransactionCache(100)

  private url: string

  private emptyTxHash = '0x' + '0'.repeat(64)

  private static CHECK_SIZE = 50

  constructor(url: string, lockHashInfos: LockHashInfo[], tipNumberSubject: Subject<string | undefined>) {
    this.lockHashInfos = lockHashInfos
    this.url = url
    this.indexerRPC = new IndexerRPC(url)
    this.getBlocksService = new GetBlocks(url)
    this.blockNumberService = new BlockNumber()
    this.tipNumberListener = tipNumberSubject.subscribe(async (num: string) => {
      if (num) {
        this.tipBlockNumber = BigInt(num)
      }
    })
  }

  public setLockHashInfos = (lockHashInfos: LockHashInfo[]): void => {
    this.lockHashInfos = lockHashInfos
    this.indexed = false
  }

  public appendLockHashInfos = (lockHashInfos: LockHashInfo[]): void => {
    const infos = this.lockHashInfos.concat(lockHashInfos)
    this.setLockHashInfos(infos)
  }

  public reset = () => {
    this.resetFlag = true
  }

  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true
        if (this.resetFlag) {
          await this.blockNumberService.updateCurrent(BigInt(-1))
          this.resetFlag = false
        }
        const { lockHashInfos } = this
        const currentBlockNumber: bigint = await this.blockNumberService.getCurrent()
        if (!this.indexed || currentBlockNumber !== this.tipBlockNumber) {
          if (!this.indexed) {
            await this.indexLockHashes(lockHashInfos)
            this.indexed = true
          }
          const daoScriptInfo = await DaoUtils.daoScript(this.url)
          const daoScriptHash = LockUtils.computeScriptHash({
            codeHash: daoScriptInfo.codeHash,
            args: "0x",
            hashType: daoScriptInfo.hashType,
          })
          const lockHashes: string[] = lockHashInfos.map(info => info.lockHash)
          const minBlockNumber = await this.getCurrentBlockNumber(lockHashes)
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, TxPointType.CreatedBy, currentBlockNumber, daoScriptHash)
          }
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, TxPointType.ConsumedBy, currentBlockNumber, daoScriptHash)
          }
          if (minBlockNumber) {
            await this.blockNumberService.updateCurrent(minBlockNumber)
          }
        }
        await this.yield(this.interval)
      } catch (err) {
        if (err.message.startsWith('connect ECONNREFUSED')) {
          logger.debug('sync indexer error:', err)
        } else {
          logger.error('sync indexer error:', err)
        }
      } finally {
        await this.yield()
        this.inProcess = false
      }
    }
  }

  public processFork = async () => {
    while (!this.stopped) {
      try {
        const tip = this.tipBlockNumber
        const txs = await IndexerTransaction.txHashes()
        for (const tx of txs) {
          const result = await this.getBlocksService.getTransaction(tx.hash)
          if (!result) {
            await IndexerTransaction.deleteTxWhenFork(tx.hash)
            this.txCache.delete(tx.hash)
          } else if (tip - BigInt(tx.blockNumber) >= IndexerQueue.CHECK_SIZE) {
            await IndexerTransaction.confirm(tx.hash)
          }
        }
      } catch (err) {
        logger.error(`indexer delete forked tx:`, err)
      } finally {
        await this.yield(10000)
      }
    }
  }

  public getCurrentBlockNumber = async (lockHashes: string[]) => {
    // get lock hash indexer status
    const lockHashIndexStates = await this.indexerRPC.getLockHashIndexStates()
    const blockNumbers = lockHashIndexStates
      .filter(state => lockHashes.includes(state.lockHash))
      .map(state => HexUtils.toDecimal(state.blockNumber))
    const uniqueBlockNumbers = [...new Set(blockNumbers)]
    const blockNumbersBigInt = uniqueBlockNumbers.map(num => BigInt(num))
    return ArrayUtils.min(blockNumbersBigInt)
  }

  public indexLockHashes = async (lockHashInfos: LockHashInfo[]) => {
    const lockHashIndexStates = await this.indexerRPC.getLockHashIndexStates()
    const indexedLockHashes: string[] = lockHashIndexStates.map(state => state.lockHash)
    const nonIndexedLockHashInfos = lockHashInfos.filter(i => !indexedLockHashes.includes(i.lockHash))

    await ArrayUtils.mapSeries(nonIndexedLockHashInfos, async (info: LockHashInfo) => {
      const indexFrom: string | undefined = info.isImporting ? '0x0' : undefined
      await this.indexerRPC.indexLockHash(info.lockHash, indexFrom)
    })
  }

  public getTransaction = async (txHash: string): Promise<TransactionWithStatus> => {
    let txWithStatus = this.txCache.get(txHash)
    if (!txWithStatus) {
      const transactionWithStatus = await this.getBlocksService.getTransaction(txHash)
      txWithStatus = TypeConvert.toTransactionWithStatus(transactionWithStatus)
      this.txCache.push(txWithStatus)
    }
    return txWithStatus
  }

  // type: 'createdBy' | 'consumedBy'
  public pipeline = async (lockHash: string, type: TxPointType, startBlockNumber: bigint, daoScriptHash: string) => {
    let page = 0
    let stopped = false
    while (!stopped) {
      const txs = await this.indexerRPC.getTransactionsByLockHash(lockHash, `0x${page.toString(16)}`, `0x${this.per.toString(16)}`)
      if (txs.length < this.per) {
        stopped = true
      }
      logger.debug(`indexer txs for: ${type} ${lockHash}, page: ${page}, tx count: ${txs.length}`)

      for (const tx of txs) {
        let txPoint: CKBComponents.TransactionPoint | null = null
        if (type === TxPointType.CreatedBy) {
          txPoint = tx.createdBy
        } else if (type === TxPointType.ConsumedBy) {
          txPoint = tx.consumedBy
        }

        if (
          txPoint &&
          (BigInt(txPoint.blockNumber) >= startBlockNumber || this.tipBlockNumber - BigInt(txPoint.blockNumber) < IndexerQueue.CHECK_SIZE)
        ) {
          const transactionWithStatus = await this.getTransaction(txPoint.txHash)
          const transaction: Transaction = transactionWithStatus.transaction
          const txUniqueFlag = {
            txHash: transaction.hash,
            blockHash: transactionWithStatus.txStatus.blockHash!
          }
          if (type === TxPointType.CreatedBy && this.latestCreatedBy.includes(txUniqueFlag)) {
            const address = LockUtils.lockScriptToAddress(
              transaction.outputs![parseInt(txPoint.index, 16)].lock,
              NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
            )
            AddressesUsedSubject.getSubject().next({
              addresses: [address],
              url: this.url,
            })
            continue
          }

          // tx timestamp / blockNumber / blockHash
          let txEntity: TransactionEntity | undefined = await TransactionPersistor.get(transaction.hash)
          if (!txEntity || !txEntity.blockHash) {
            if (!txEntity) {
              for (const [inputIndex, input] of transaction.inputs!.entries()) {
                if (input.previousOutput!.txHash === this.emptyTxHash) {
                  continue
                }
                const previousTxWithStatus = await this.getBlocksService.getTransaction(input.previousOutput!.txHash)
                const previousTx = TypeConvert.toTransaction(previousTxWithStatus.transaction)
                const previousOutput = previousTx.outputs![+input.previousOutput!.index]
                input.lock = previousOutput.lock
                input.lockHash = LockUtils.lockScriptToHash(input.lock)
                input.capacity = previousOutput.capacity
                input.inputIndex = inputIndex.toString()
                if (
                  type === TxPointType.CreatedBy &&
                  previousOutput.type &&
                  LockUtils.computeScriptHash(previousOutput.type) === daoScriptHash &&
                  previousTx.outputsData![+input.previousOutput!.index] === '0x0000000000000000'
                ) {
                  transaction.outputs![+txPoint.index].depositOutPoint = {
                    txHash: input.previousOutput!.txHash,
                    index: input.previousOutput!.index,
                  }
                }
              }

              const outputs = transaction.outputs!
              for (let i = 0; i < outputs.length; ++i) {
                const output = outputs[i]
                const typeScript = output.type
                if (typeScript) {
                  output.typeHash = LockUtils.computeScriptHash(typeScript)
                  if (output.typeHash === daoScriptHash) {
                    output.daoData = transaction.outputsData![i]
                  }
                }
              }
            }
            const { blockHash } = transactionWithStatus.txStatus
            if (blockHash) {
              const blockHeader = await this.getBlocksService.getHeader(blockHash)
              if (blockHeader) {
                transaction.blockHash = blockHash
                transaction.blockNumber = blockHeader.number
                transaction.timestamp = blockHeader.timestamp
              }
            }
            txEntity = await TransactionPersistor.saveFetchTx(transaction)
          }

          let address: string | undefined
          if (type === TxPointType.CreatedBy) {
            address = LockUtils.lockScriptToAddress(
              transaction.outputs![parseInt(txPoint.index, 16)].lock,
              NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
            )
            this.latestCreatedBy.push(txUniqueFlag)
          } else if (type === TxPointType.ConsumedBy) {
            const input = txEntity.inputs[parseInt(txPoint.index, 16)]
            const output = await IndexerTransaction.updateInputLockHash(input.outPointTxHash!, input.outPointIndex!)
            if (output) {
              address = LockUtils.lockScriptToAddress(
                output.lock,
                NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet
              )
            }
          }
          if (address) {
            AddressesUsedSubject.getSubject().next({
              addresses: [address],
              url: this.url,
            })
          }
        }
      }
      page += 1
    }
  }

  public stop = () => {
    this.tipNumberListener.unsubscribe()
    this.stopped = true
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await this.yield(50)
    }
  }

  public stopAndWait = async () => {
    this.stop()
    await this.waitForDrained()
  }

  private yield = async (millisecond: number = 1) => {
    await CommonUtils.sleep(millisecond)
  }
}
