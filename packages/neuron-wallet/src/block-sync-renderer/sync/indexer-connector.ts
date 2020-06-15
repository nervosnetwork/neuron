import { Subject } from 'rxjs'
import { Indexer, Tip } from '@ckb-lumos/indexer'
import CommonUtils from 'utils/common'
import RpcService from 'services/rpc-service'
import AddressParser from "models/address-parser"
import TransactionWithStatus from 'models/chain/transaction-with-status'

export default class IndexerConnector {
  private indexer: Indexer
  private rpcService: RpcService
  private stop: boolean = true
  private addressesToWatch: string[] = []
  public blockTipSubject: Subject<Tip> = new Subject<Tip>()
  public transactionsSubject: Subject<Array<TransactionWithStatus>> = new Subject<Array<TransactionWithStatus>>()

  constructor(addresses: string[], nodeUrl: string, indexerFolderPath: string) {
    this.indexer = new Indexer(nodeUrl, indexerFolderPath)
    this.addressesToWatch = addresses
    this.rpcService = new RpcService(nodeUrl)
  }

  public async connect() {
    this.indexer.startForever()
    this.stop = false

    while (!this.stop) {
      const lastIndexerTip = this.indexer.tip()
      this.blockTipSubject.next(lastIndexerTip)

      const sortedGroupedTransactions = await this.fetchNewTransactions()
      for (const txs of sortedGroupedTransactions) {
        this.transactionsSubject.next(txs)
      }

      await CommonUtils.sleep(5000)
    }
  }

  private async fetchNewTransactions() {
    const transactions = await Promise.all(
      this.addressesToWatch.map(async address => {
        const lockScript = AddressParser.parse(address)
        const txHashes = this.indexer.getTransactionsByLockScript({
          code_hash: lockScript.codeHash,
          hash_type: lockScript.hashType,
          args: lockScript.args
        })

        if (!txHashes) {
          return []
        }

        const txs = await Promise.all(
          txHashes.map(async hash => {
            const txWithStatus = await this.rpcService.getTransaction(hash)
            if (!txWithStatus) {
              throw new Error(`failed to fetch transaction for hash ${hash}`)
            }
            const blockHeader = await this.rpcService.getHeader(txWithStatus!.txStatus.blockHash!)
            txWithStatus!.transaction.blockNumber = blockHeader?.number
            txWithStatus!.transaction.blockHash = txWithStatus!.txStatus.blockHash!
            txWithStatus!.transaction.timestamp = blockHeader?.timestamp
            return txWithStatus
          })
        )
        return txs
      })
    )

    const groupedTransactions = transactions
      .flat()
      .filter((tx: TransactionWithStatus) => tx)
      .reduce((groupedMap: Map<string, Array<TransactionWithStatus>>, tx: TransactionWithStatus) => {
        const {transaction} = tx
        if (transaction.blockNumber === undefined) {
          return groupedMap
        }
        const blockNumber = transaction.blockNumber.toString()

        const grouped = groupedMap.get(blockNumber) || []
        grouped.push(tx)

        groupedMap.set(blockNumber, grouped)
        return groupedMap
      }, new Map())

    const sortedGroupedTransactions = [...groupedTransactions!.keys()]
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(blockNumber => groupedTransactions!.get(blockNumber))

    return sortedGroupedTransactions
  }
}
