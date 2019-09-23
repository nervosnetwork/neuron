import { Subject, Subscription } from 'rxjs'
import Utils from 'services/sync/utils'
import logger from 'utils/logger'
import GetBlocks from 'services/sync/get-blocks'
import { Transaction } from 'types/cell-types'
import TypeConvert from 'types/type-convert'
import BlockNumber from 'services/sync/block-number'
import AddressesUsedSubject from 'models/subjects/addresses-used-subject'
import LockUtils from 'models/lock-utils'
import TransactionPersistor from 'services/tx/transaction-persistor'
import IndexerTransaction from 'services/tx/indexer-transaction'

import IndexerRPC from './indexer-rpc'
import HexUtils from 'utils/hex'

export interface LockHashInfo {
  lockHash: string
  isImporting: boolean | undefined
}

enum TxPointType {
  CreatedBy = 'createdBy',
  ConsumedBy = 'consumedBy',
}

export default class IndexerQueue {
  // private lockHashes: string[]
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

  constructor(url: string, lockHashInfos: LockHashInfo[], tipNumberSubject: Subject<string | undefined>) {
    // this.lockHashes = lockHashes
    this.lockHashInfos = lockHashInfos
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
    // this.lockHashes = lockHashes
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

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "off" */
  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true
        if (this.resetFlag) {
          await this.blockNumberService.updateCurrent(BigInt(0))
          this.resetFlag = false
        }
        const { lockHashInfos } = this
        const currentBlockNumber: bigint = await this.blockNumberService.getCurrent()
        if (!this.indexed || currentBlockNumber !== this.tipBlockNumber) {
          if (!this.indexed) {
            await this.indexLockHashes(lockHashInfos)
            this.indexed = true
          }
          const lockHashes: string[] = lockHashInfos.map(info => info.lockHash)
          const minBlockNumber = await this.getCurrentBlockNumber(lockHashes)
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, TxPointType.CreatedBy, currentBlockNumber)
          }
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, TxPointType.ConsumedBy, currentBlockNumber)
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
          } else if (tip - BigInt(tx.blockNumber) >= 1000) {
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
    const minBlockNumber = Utils.min(blockNumbersBigInt)
    return minBlockNumber
  }

  public indexLockHashes = async (lockHashInfos: LockHashInfo[]) => {
    const lockHashIndexStates = await this.indexerRPC.getLockHashIndexStates()
    const indexedLockHashes: string[] = lockHashIndexStates.map(state => state.lockHash)
    const nonIndexedLockHashInfos = lockHashInfos.filter(i => !indexedLockHashes.includes(i.lockHash))

    await Utils.mapSeries(nonIndexedLockHashInfos, async (info: LockHashInfo) => {
      const indexFrom: string | undefined = info.isImporting ? '0' : undefined
      await this.indexerRPC.indexLockHash(info.lockHash, indexFrom)
    })
  }

  // type: 'createdBy' | 'consumedBy'
  public pipeline = async (lockHash: string, type: TxPointType, startBlockNumber: bigint) => {
    let page = 0
    let stopped = false
    while (!stopped) {
      const txs = await this.indexerRPC.getTransactionByLockHash(lockHash, page.toString(), this.per.toString())
      if (txs.length < this.per) {
        stopped = true
      }
      for (const tx of txs) {
        let txPoint: CKBComponents.TransactionPoint | null = null
        if (type === TxPointType.CreatedBy) {
          txPoint = tx.createdBy
        } else if (type === TxPointType.ConsumedBy) {
          txPoint = tx.consumedBy
        }

        if (
          txPoint &&
          (BigInt(txPoint.blockNumber) >= startBlockNumber || this.tipBlockNumber - BigInt(txPoint.blockNumber) < 1000)
        ) {
          const transactionWithStatus = await this.getBlocksService.getTransaction(txPoint.txHash)
          const ckbTransaction: CKBComponents.Transaction = transactionWithStatus.transaction
          const transaction: Transaction = TypeConvert.toTransaction(ckbTransaction)
          // tx timestamp / blockNumber / blockHash
          const { blockHash } = transactionWithStatus.txStatus
          if (blockHash) {
            const blockHeader = await this.getBlocksService.getHeader(blockHash)
            transaction.blockHash = blockHash
            transaction.blockNumber = blockHeader.number
            transaction.timestamp = blockHeader.timestamp
          }
          // broadcast address used
          const txEntity = await TransactionPersistor.saveFetchTx(transaction)

          let address: string | undefined
          if (type === TxPointType.CreatedBy) {
            address = LockUtils.lockScriptToAddress(transaction.outputs![parseInt(txPoint.index, 16)].lock)
          } else if (type === TxPointType.ConsumedBy) {
            const input = txEntity.inputs[parseInt(txPoint.index, 16)]
            const output = await IndexerTransaction.updateInputLockHash(input.outPointTxHash!, input.outPointIndex!)
            if (output) {
              address = LockUtils.lockScriptToAddress(output.lock)
            }
          }
          if (address) {
            AddressesUsedSubject.getSubject().next([address])
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
    await Utils.sleep(millisecond)
  }
}
