import env from 'env'
import { ipcRenderer } from 'electron'

import path from 'path'
import { queue } from 'async'

import { TransactionPersistor } from 'services/tx'
import WalletService from 'services/wallets'
import RpcService from 'services/rpc-service'
import OutPoint from 'models/chain/out-point'
import Transaction from 'models/chain/transaction'
import TransactionWithStatus from 'models/chain/transaction-with-status'
import CommonUtils from 'utils/common'
import RangeForCheck from './range-for-check'
import TxAddressFinder from './tx-address-finder'
import SystemScriptInfo from 'models/system-script-info'
import AssetAccountInfo from 'models/asset-account-info'
import AssetAccountService from 'services/asset-account-service'
import { Address as AddressInterface } from 'database/address/address-dao'
import AddressParser from 'models/address-parser'
import MultiSign from 'models/multi-sign'
import IndexerConnector from './indexer-connector'

export default class Queue {
  private lockHashes: string[]
  private url: string
  private addresses: AddressInterface[]
  private rpcService: RpcService
  private indexerConnector: IndexerConnector | undefined
  private currentBlockNumber = BigInt(0)
  private rangeForCheck: RangeForCheck

  private stopped: boolean = false
  private inProcess: boolean = false

  private multiSignBlake160s: string[]
  private anyoneCanPayLockHashes: string[]
  private assetAccountInfo: AssetAccountInfo

  constructor(url: string, addresses: AddressInterface[]) {
    this.url = url
    this.addresses = addresses
    this.rpcService = new RpcService(url)
    this.rangeForCheck = new RangeForCheck(url)
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
    const { app } = env
    const chain = await this.rpcService.getChain()
    const indexedDataPath = path.resolve(
      app.getPath('userData'),
      chain.replace('ckb_', ''),
      './indexer_data',
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

    const checkAndSaveQueue = queue(async (task: any) => {
      const {transactions} = task
      await this.checkAndSave(transactions)
    })

    checkAndSaveQueue.error((err: any, task: any) => {
      console.error(err, task)
    })

    this.indexerConnector.transactionsSubject
      .subscribe(transactions => {
        const task = {
          transactions: transactions.map(
            transactionWithStatus => transactionWithStatus.transaction
          )
        }
        checkAndSaveQueue.push(task)
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
          if (previousTxHash === `0x${'0'.repeat(64)}`) {
            continue;
          }
          let previousTxWithStatus: TransactionWithStatus | undefined = cachedPreviousTxs.get(previousTxHash)
          if (!previousTxWithStatus) {
            previousTxWithStatus = await this.rpcService.getTransaction(previousTxHash)
            cachedPreviousTxs.set(previousTxHash, previousTxWithStatus)
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
    }
    cachedPreviousTxs.clear()
  }

  private updateCurrentBlockNumber(blockNumber: BigInt) {
    this.currentBlockNumber = BigInt(blockNumber)
    ipcRenderer.invoke('synced-block-number-updated', (this.currentBlockNumber - BigInt(1)).toString())
  }
}

// const deleteFolderRecursive = function(dirPath) {
//   if (fs.existsSync(dirPath)) {
//     fs.readdirSync(dirPath).forEach((file, index) => {
//       const curPath = path.join(dirPath, file);
//       if (fs.lstatSync(curPath).isDirectory()) { // recurse
//         deleteFolderRecursive(curPath);
//       } else { // delete file
//         fs.unlinkSync(curPath);
//       }
//     });
//     fs.rmdirSync(dirPath);
//   }
// };
