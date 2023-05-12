import { queue, AsyncQueue } from 'async'
import { TransactionPersistor } from '../../services/tx'
import RpcService from '../../services/rpc-service'
import AssetAccountService from '../../services/asset-account-service'
import OutPoint from '../../models/chain/out-point'
import Transaction from '../../models/chain/transaction'
import TransactionWithStatus from '../../models/chain/transaction-with-status'
import SystemScriptInfo from '../../models/system-script-info'
import AssetAccountInfo from '../../models/asset-account-info'
import { Address as AddressInterface } from '../../models/address'
import AddressParser from '../../models/address-parser'
import Multisig from '../../models/multisig'
import TxAddressFinder from './tx-address-finder'
import IndexerConnector, { BlockTips } from './indexer-connector'
import IndexerCacheService from './indexer-cache-service'
import logger from '../../utils/logger'
import CommonUtils from '../../utils/common'
import { ShouldInChildProcess } from '../../exceptions'

export default class Queue {
  // eslint-disable-next-line prettier/prettier
  #lockHashes: string[]
  #url: string // ckb node
  #indexerUrl: string
  #addresses: AddressInterface[]
  #rpcService: RpcService
  #indexerConnector: IndexerConnector | undefined
  #checkAndSaveQueue: AsyncQueue<{ transactions: Transaction[] }> | undefined

  #multiSignBlake160s: string[]
  #anyoneCanPayLockHashes: string[]
  #assetAccountInfo: AssetAccountInfo

  constructor(url: string, addresses: AddressInterface[], indexerUrl: string) {
    this.#url = url
    this.#indexerUrl = indexerUrl
    this.#addresses = addresses
    this.#rpcService = new RpcService(url)
    this.#assetAccountInfo = new AssetAccountInfo()
    this.#lockHashes = AddressParser.batchToLockHash(this.#addresses.map(meta => meta.address))

    const blake160s = this.#addresses.map(meta => meta.blake160)
    this.#multiSignBlake160s = blake160s.map(blake160 => Multisig.hash([blake160]))
    this.#anyoneCanPayLockHashes = blake160s.map(b => this.#assetAccountInfo.generateAnyoneCanPayScript(b).computeHash())
  }

  start = async () => {
    logger.info("Queue:\tstart")
    try {
      this.#indexerConnector = new IndexerConnector(this.#addresses, this.#url, this.#indexerUrl)

      await this.#indexerConnector.connect()
    } catch (error) {
      logger.error('Restarting child process due to error', error.message)
      if (process.send) {
        process.send({ channel: 'indexer-error' })
      } else {
        throw new ShouldInChildProcess()
      }
      return
    }
    this.#indexerConnector.blockTipsSubject.subscribe(tip => this.#updateBlockNumberTips(tip))

    this.#checkAndSaveQueue = queue(async (task: any) => {
      const { transactions } = task
      //need to retry after a certain period of time if throws errors
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await this.#checkAndSave(transactions)
          break
        } catch (error) {
          logger.error('retry saving transactions in 2 seconds due to error:', error)
          await CommonUtils.sleep(2000)
        }
      }

      this.#indexerConnector!.notifyCurrentBlockNumberProcessed(transactions[0].blockNumber)
    })

    this.#checkAndSaveQueue.error((err: any, task: any) => {
      logger.error(err, JSON.stringify(task, undefined, 2))
    })

    this.#indexerConnector.transactionsSubject
      .subscribe(transactions => {
        const task = { transactions: transactions.map(t => t.transaction) }
        this.#checkAndSaveQueue!.push(task)
      })
  }

  getIndexerConnector = (): IndexerConnector => this.#indexerConnector!

  stop = () => this.#indexerConnector!.pollingIndexer = false

  stopAndWait = async () => {
    this.stop()
    if (this.#checkAndSaveQueue) {
      this.#checkAndSaveQueue.idle() ? true : await this.#checkAndSaveQueue.drain()
    }
  }

  #checkAndSave = async (transactions: Transaction[]): Promise<void> => {
    const cachedPreviousTxs = new Map()

    const fetchTxQueue = queue(async (task: any) => {
      const { txHash } = task

      const previousTxWithStatus = await this.#rpcService.getTransaction(txHash)
      cachedPreviousTxs.set(txHash, previousTxWithStatus)
    }, 1)

    const drainFetchTxQueue = new Promise((resolve, reject) => {
      fetchTxQueue.error(reject)
      fetchTxQueue.drain(() => resolve(0))
    })

    const txHashSet = new Set()
    for (const [, tx] of transactions.entries()) {
      for (const [, input] of tx.inputs.entries()) {
        const previousTxHash = input.previousOutput!.txHash
        if (previousTxHash === `0x${'0'.repeat(64)}`) {
          continue;
        }

        if (txHashSet.has(previousTxHash)) {
          continue;
        }

        fetchTxQueue.push({ txHash: previousTxHash })
        txHashSet.add(previousTxHash)
      }
    }

    if (!fetchTxQueue.idle()) {
      await drainFetchTxQueue
    }

    for (const [, tx] of transactions.entries()) {
      const [, , anyoneCanPayInfos] = await new TxAddressFinder(
        this.#lockHashes,
        this.#anyoneCanPayLockHashes,
        tx,
        this.#multiSignBlake160s
      ).addresses()
      for (const [inputIndex, input] of tx.inputs.entries()) {
        const previousTxHash = input.previousOutput!.txHash
        const previousTxWithStatus: TransactionWithStatus | undefined = cachedPreviousTxs.get(previousTxHash)
        if (!previousTxWithStatus) {
          continue
        }

        const previousTx = previousTxWithStatus!.transaction
        const previousOutput = previousTx.outputs![+input.previousOutput!.index]
        const previousOutputData = previousTx.outputsData![+input.previousOutput!.index]
        input.setLock(previousOutput.lock)
        previousOutput.type && input.setType(previousOutput.type)
        input.setData(previousOutputData)
        input.setCapacity(previousOutput.capacity)
        input.setInputIndex(inputIndex.toString())

        if (
          previousOutput.type?.computeHash() === SystemScriptInfo.DAO_SCRIPT_HASH &&
          previousTx.outputsData![+input.previousOutput!.index] === '0x0000000000000000'
        ) {
          const output = tx.outputs![inputIndex]
          if (output) {
            output.setDepositOutPoint(new OutPoint(
              input.previousOutput!.txHash,
              input.previousOutput!.index,
            ))
          }
        }
      }
      await TransactionPersistor.saveFetchTx(tx)
      for (const info of anyoneCanPayInfos) {
        await AssetAccountService.checkAndSaveAssetAccountWhenSync(info.tokenID, info.blake160)
      }

      await this.#checkAndGenerateAddressesByTx(tx)
      await IndexerCacheService.updateCacheProcessed(tx.hash!)
    }
  }

  #checkAndGenerateAddressesByTx = async (tx: Transaction) => {
    const walletIds = new Set(
      this.#addresses
        .filter(
          addr =>
            tx.inputs.some(input => input.lock?.args === addr.blake160) ||
            tx.outputs.some(output => output.lock?.args === addr.blake160)
        )
        .map(addr => addr.walletId)
    )
    if (process.send) {
      process.send({ channel: 'check-and-save-wallet-address', message: [...walletIds] })
    } else {
      throw new ShouldInChildProcess()
    }
  }

  #updateBlockNumberTips = (tip: BlockTips) => {
    if (process.send) {
      process.send({
        channel: 'cache-tip-block-updated',
        message: {
          indexerTipNumber: tip.indexerTipNumber,
          cacheTipNumber: tip.cacheTipNumber,
          timestamp: Date.now()
        }
      })
    } else {
      throw new ShouldInChildProcess()
    }
  }
}
