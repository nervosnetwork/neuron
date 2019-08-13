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

import IndexerRPC from './indexer-rpc'

export default class Queue {
  private lockHashes: string[]
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

  constructor(url: string, lockHashes: string[], tipNumberSubject: Subject<string | undefined>) {
    this.lockHashes = lockHashes
    this.indexerRPC = new IndexerRPC(url)
    this.getBlocksService = new GetBlocks()
    this.blockNumberService = new BlockNumber()
    this.tipNumberListener = tipNumberSubject.subscribe(async (num: string) => {
      if (num) {
        this.tipBlockNumber = BigInt(num)
      }
    })
  }

  public setLockHashes = (lockHashes: string[]): void => {
    this.lockHashes = lockHashes
    this.indexed = false
  }

  /* eslint no-await-in-loop: "off" */
  /* eslint no-restricted-syntax: "off" */
  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true
        const { lockHashes } = this
        const currentBlockNumber: bigint = await this.blockNumberService.getCurrent()
        if (!this.indexed || currentBlockNumber !== this.tipBlockNumber) {
          if (!this.indexed) {
            await this.indexLockHashes(lockHashes)
            this.indexed = true
          }
          const minBlockNumber = await this.getCurrentBlockNumber(lockHashes)
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, 'createdBy', currentBlockNumber)
          }
          for (const lockHash of lockHashes) {
            await this.pipeline(lockHash, 'consumedBy', currentBlockNumber)
          }
          if (minBlockNumber) {
            await this.blockNumberService.updateCurrent(minBlockNumber)
          }
        }
        await this.yield(this.interval)
      } catch (err) {
        logger.error('sync indexer error:', err)
      } finally {
        await this.yield()
        this.inProcess = false
      }
    }
  }

  public getCurrentBlockNumber = async (lockHashes: string[]) => {
    // get lock hash indexer status
    const lockHashIndexStates = await this.indexerRPC.getLockHashIndexStates()
    const blockNumbers = lockHashIndexStates
      .filter(state => lockHashes.includes(state.lockHash))
      .map(state => state.blockNumber)
    const uniqueBlockNumbers = [...new Set(blockNumbers)]
    const blockNumbersBigInt = uniqueBlockNumbers.map(num => BigInt(num))
    const minBlockNumber = blockNumbersBigInt.sort()[0]
    return minBlockNumber
  }

  public indexLockHashes = async (lockHashes: string[]) => {
    const lockHashIndexStates = await this.indexerRPC.getLockHashIndexStates()
    const indexedLockHashes: string[] = lockHashIndexStates.map(state => state.lockHash)
    const nonIndexedLockHashes = lockHashes.filter(i => !indexedLockHashes.includes(i))

    await Utils.mapSeries(nonIndexedLockHashes, async (lockHash: string) => {
      await this.indexerRPC.indexLockHash(lockHash)
    })
  }

  // type: 'createdBy' | 'consumedBy'
  public pipeline = async (lockHash: string, type: string, startBlockNumber: bigint) => {
    let page = 0
    let stopped = false
    while (!stopped) {
      const txs = await this.indexerRPC.getTransactionByLockHash(lockHash, page.toString(), this.per.toString())
      if (txs.length < this.per) {
        stopped = true
      }
      for (const tx of txs) {
        let txPoint: CKBComponents.TransactionPoint | null = null
        if (type === 'createdBy') {
          txPoint = tx.createdBy
        } else if (type === 'consumedBy') {
          txPoint = tx.consumedBy
        }
        if (txPoint && BigInt(txPoint.blockNumber) > startBlockNumber) {
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
          const address = LockUtils.lockScriptToAddress(transaction.outputs![+txPoint.index].lock)
          AddressesUsedSubject.getSubject().next([address])
          await TransactionPersistor.saveFetchTx(transaction)
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
