import env from 'env'
import { ipcRenderer } from 'electron'

import path from 'path'
import { queue, AsyncQueue } from 'async'

import { TransactionPersistor } from 'services/tx'
import WalletService from 'services/wallets'
import RpcService from 'services/rpc-service'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import CommonUtils from 'utils/common'
import TxAddressFinder from './tx-address-finder'
import SystemScriptInfo from 'models/system-script-info'
import AssetAccountInfo from 'models/asset-account-info'
import AssetAccountService from 'services/asset-account-service'
import { Address as AddressInterface } from 'database/address/address-dao'
import AddressParser from 'models/address-parser'
import MultiSign from 'models/multi-sign'
import IndexerConnector from './indexer-connector'
import IndexerCacheService from './indexer-cache-service'

export default class Queue {
  private lockHashes: string[]
  private url: string
  private addresses: AddressInterface[]
  private rpcService: RpcService
  private indexerConnector: IndexerConnector | undefined
  private checkAndSaveQueue: AsyncQueue<{transactions: Transaction[]}> | undefined
  private currentBlockNumber = BigInt(0)
  private inProcess: boolean = false

  private multiSignBlake160s: string[]
  private anyoneCanPayLockHashes: string[]
  private assetAccountInfo: AssetAccountInfo

  constructor(url: string, addresses: AddressInterface[]) {
    this.url = url
    this.addresses = addresses
    this.rpcService = new RpcService(url)
    this.assetAccountInfo = new AssetAccountInfo()

    this.lockHashes = AddressParser.batchToLockHash(
      this.addresses.map(meta => meta.address)
    )

    const multiSign = new MultiSign()
    const blake160s = this.addresses.map(meta => meta.blake160)
    this.multiSignBlake160s = blake160s.map(blake160 => multiSign.hash(blake160))
    this.anyoneCanPayLockHashes = blake160s.map(
      b => this.assetAccountInfo.generateAnyoneCanPayScript(b).computeHash()
    )
  }

  public async start() {
    const indexedDataPath = path.resolve(
      env.fileBasePath,
      './indexer_data',
      await this.rpcService.genesisBlockHash()
    )

    this.indexerConnector = new IndexerConnector(
      this.addresses,
      this.url,
      indexedDataPath
    )
    this.indexerConnector.connect()
    this.indexerConnector.blockTipSubject.subscribe(tip => {
      this.updateCurrentBlockNumber(BigInt(tip.block_number))
    });

    this.checkAndSaveQueue = queue(async (task: any) => {
      const {transactions} = task
      await this.checkAndSave(transactions)

      const firstTx = transactions.shift()
      if (firstTx) {
        await this.indexerConnector!.notifyCurrentBlockNumberProcessed(firstTx.blockNumber!)
      }
    })

    this.checkAndSaveQueue.error((err: any, task: any) => {
      console.error(err, task)
    })

    this.indexerConnector.transactionsSubject
      .subscribe(transactions => {
        const task = {
          transactions: transactions.map(
            transactionWithStatus => transactionWithStatus.transaction
          )
        }
        this.checkAndSaveQueue!.push(task)
      })

  }

  public stop = () => {
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt: number = +new Date()
    while (this.inProcess) {
      const now: number = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await CommonUtils.sleep(50)
    }
  }

  public stopAndWait = async (timeout: number = 5000) => {
    this.stop()
    await this.waitForDrained(timeout)
  }

  private checkAndSave = async (transactions: Transaction[]): Promise<void> => {
    const cachedPreviousTxs = new Map()

    const fetchTxQueue = queue(async (task: any) => {
      const {txHash} = task

      const previousTxWithStatus = await this.rpcService.getTransaction(txHash)
      cachedPreviousTxs.set(txHash, previousTxWithStatus)
    }, 100)

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

        fetchTxQueue.push({txHash: previousTxHash})
        txHashSet.add(previousTxHash)
      }
    }
    await fetchTxQueue.drain()

    for (const [, tx] of transactions.entries()) {
      const [shouldSave, addresses, anyoneCanPayInfos] = await new TxAddressFinder(
        this.lockHashes,
        this.anyoneCanPayLockHashes,
        tx,
        this.multiSignBlake160s
      ).addresses()
      if (shouldSave) {
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
        const anyoneCanPayBlake160s = anyoneCanPayInfos.map(info => info.blake160)
        await WalletService.updateUsedAddresses(addresses, anyoneCanPayBlake160s)
        for (const info of anyoneCanPayInfos) {
          await AssetAccountService.checkAndSaveAssetAccountWhenSync(info.tokenID, info.blake160)
        }
      }
      await IndexerCacheService.updateCacheProcessed(tx.hash!)
    }
    cachedPreviousTxs.clear()
  }

  private updateCurrentBlockNumber(blockNumber: BigInt) {
    this.currentBlockNumber = BigInt(blockNumber)
    ipcRenderer.invoke('synced-block-number-updated', (this.currentBlockNumber - BigInt(1)).toString())
  }
}
