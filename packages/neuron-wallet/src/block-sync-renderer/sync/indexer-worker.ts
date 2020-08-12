import { Indexer, CellCollector, TransactionCollector } from '@ckb-lumos/indexer'
import { QueryOptions } from '@ckb-lumos/base'
import { expose } from 'utils/worker'

let indexer: Indexer | null

export type IndexerWorker = typeof indexerWorker

const indexerWorker = {
  init(uri: string, path: string) {
    indexer = new Indexer(uri, path)
  },
  startForever() {
    indexer!.startForever()
  },
  async tip() {
    return await indexer?.tip()
  },
  async collectCells(queries: QueryOptions) {
    const collector = new CellCollector(indexer!, queries)

    const result = []

    for await (const cell of collector.collect()) {
      //somehow the lumos indexer returns an invalid hash type "lock" for hash type "data"
      //for now we have to fix it here
      const cellOutput: any = cell.cell_output
      if (cellOutput.type?.hash_type === 'lock') {
        cellOutput.type.hash_type = 'data'
      }
      result.push(cell)
    }

    return result
  },
  async getTransactionHashes(lockScript: any) {
    const transactionCollector = new TransactionCollector(indexer!, {
      lock: {
        code_hash: lockScript.codeHash,
        hash_type: lockScript.hashType,
        args: lockScript.args
      }
    })

    //@ts-ignore
    return transactionCollector.getTransactionHashes().toArray()
  }
}

expose(indexerWorker)
