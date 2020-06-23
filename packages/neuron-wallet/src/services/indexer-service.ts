import path from 'path'
import env from 'env'
import { Indexer, CollectorQueries, CellCollector } from "@ckb-lumos/indexer";
import Script from "models/chain/script";
import NetworksService from './networks';

export interface LumosCell {
  block_hash: string
  out_point: { 
    tx_hash: string
    index: string
  }
  cell_output: {
    capacity: string
    lock: { 
      code_hash: string
      args: string
      hash_type: string
    }
    type?: { 
      code_hash: string
      args: string
      hash_type: string
    }
  }
  data?: string
}

export default class IndexerService {
  private static instance: IndexerService;

  public static getInstance = () => {
    if (!IndexerService.instance) {
      const { app } = env
      const network = NetworksService.getInstance().getCurrent()
      if (!network) {
        throw new Error('no node network')
      }
      const indexedDataPath = path.resolve(
        app.getPath('userData'),
        network.chain.replace('ckb_', ''),
        './indexer_data',
      )
      IndexerService.instance = new IndexerService(network.remote, indexedDataPath)
    }

    return IndexerService.instance
  }

  private indexer: Indexer

  constructor(nodeUrl: string, indexerFolderPath: string) {
    this.indexer = new Indexer(nodeUrl, indexerFolderPath)
  }

  public async getLiveCellsByScript(lock: Script | null, type: Script | null, data: string | null) {
    if (!lock && !type) {
      throw new Error('at least one parameter is required')
    }

    const queries: CollectorQueries = {}
    if (lock) {
      queries.lock = {
        code_hash: lock.codeHash,
        hash_type: lock.hashType,
        args: lock.args
      }
    }
    if (type) {
      queries.type = {
        code_hash: type.codeHash,
        hash_type: type.hashType,
        args: type.args
      }
    }
    // @ts-ignore
    queries.data = data
    
    const collector = new CellCollector(this.indexer, queries)

    const result = []
    for await (const cell of collector.collect()) {
      result.push(cell)
    }

    return result
  }
}