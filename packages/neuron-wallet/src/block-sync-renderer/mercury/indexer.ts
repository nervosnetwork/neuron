/* eslint-disable no-constant-condition */
import {
  Cell,
  CellCollector as LumosCellCollector,
  CellCollectorResults,
  Hexadecimal,
  HexString,
  Indexer as LumosIndexer,
  QueryOptions,
  Script,
  Tip,
  OutPoint,
  HexNumber,
} from '@ckb-lumos/base';
import { RPC } from '@ckb-lumos/rpc';
import axios from 'axios';
import CommonUtils from 'utils/common'
import logger from 'utils/logger'

export enum ScriptType {
  type = 'type',
  lock = 'lock',
}

export enum Order {
  asc = 'asc',
  desc = 'desc',
}

export interface TransactionsCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<string>;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];

export interface SearchKey {
  script: Script;
  script_type: ScriptType;
  filter?: {
    script?: Script;
    output_data_len_range?: HexadecimalRange;
    output_capacity_range?: HexadecimalRange;
    block_range?: HexadecimalRange;
  };
}

export interface GetLiveCellsResult {
  last_cursor: string;
  objects: IndexerCell[];
}

export interface IndexerCell {
  block_number: Hexadecimal;
  out_point: OutPoint;
  output: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
  output_data: HexString;
  tx_index: Hexadecimal;
}

export interface TerminatorResult {
  stop: boolean;
  push: boolean;
}

export declare type Terminator = (index: number, cell: Cell) => TerminatorResult;

const DefaultTerminator: Terminator = (_index, _cell) => {
  return { stop: false, push: true };
};

export class Indexer implements LumosIndexer {
  uri: string;

  constructor(public ckbRpcUrl: string, public ckbIndexerUrl: string) {
    this.uri = ckbRpcUrl;
  }

  getCkbRpc(): RPC {
    // lumos rpc returns lumos-style data structures
    return new RPC(this.ckbRpcUrl);
  }

  async tip(): Promise<Tip> {
    const res = await this.request('get_tip');
    return res as Tip;
  }

  async waitForSync(blockDifference = 0): Promise<void> {
    const rpcTipNumber = parseInt((await this.getCkbRpc().get_tip_header()).number, 16);
    logger.debug('rpcTipNumber', rpcTipNumber);
    let index = 0;
    while (true) {
      const indexerTipNumber = parseInt((await this.tip()).block_number, 16);
      logger.debug('indexerTipNumber', indexerTipNumber);
      if (indexerTipNumber + blockDifference >= rpcTipNumber) {
        return;
      }
      logger.debug(`wait until indexer sync. index: ${index++}`);
      await CommonUtils.sleep(1000);
    }
  }

  collector(queries: QueryOptions): LumosCellCollector {
    const { lock, type } = queries;
    let searchKey: SearchKey;
    if (lock !== undefined) {
      searchKey = {
        script: lock as Script,
        script_type: ScriptType.lock,
      };
      if (type != undefined && type !== 'empty') {
        searchKey.filter = {
          script: type as Script,
        };
      }
    } else {
      if (type != undefined && type != 'empty') {
        searchKey = {
          script: type as Script,
          script_type: ScriptType.type,
        };
      } else {
        throw new Error(
          `should specify either type or lock in queries, queries now: ${JSON.stringify(queries, null, 2)}`,
        );
      }
    }
    const queryData = queries.data || '0x';
    const request = this.request;
    const ckbIndexerUrl = this.ckbIndexerUrl;
    return {
      collect(): CellCollectorResults {
        return {
          async *[Symbol.asyncIterator]() {
            const order = 'asc';
            const sizeLimit = 100;
            let cursor = null;
            for (;;) {
              const params: any = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
              const res = await request('get_cells', params, ckbIndexerUrl);
              const liveCells = res.objects;
              cursor = res.last_cursor;
              for (const cell of liveCells) {
                if (queryData === 'any' || queryData === cell.output_data) {
                  yield {
                    cell_output: cell.output,
                    data: cell.output_data,
                    out_point: cell.out_point,
                    block_number: cell.block_number,
                  };
                }
              }
              if (liveCells.length < sizeLimit) {
                break;
              }
            }
          },
        };
      },
    };
  }

  txCollector(queries: QueryOptions) {
    const { lock, type } = queries;
    let searchKey: SearchKey;
    if (lock !== undefined) {
      searchKey = {
        script: lock as Script,
        script_type: ScriptType.lock,
      };
      if (type != undefined && type !== 'empty') {
        searchKey.filter = {
          script: type as Script,
        };
      }
    } else {
      if (type != undefined && type != 'empty') {
        searchKey = {
          script: type as Script,
          script_type: ScriptType.type,
        };
      } else {
        throw new Error(
          `should specify either type or lock in queries, queries now: ${JSON.stringify(queries, null, 2)}`,
        );
      }
    }
    const request = this.request;
    const ckbIndexerUrl = this.ckbIndexerUrl;
    return {
      collect(): TransactionsCollectorResults {
        return {
          async *[Symbol.asyncIterator]() {
            const order = 'asc';
            const sizeLimit = 100;
            let cursor = null;
            for (;;) {
              const params: any = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
              const res = await request('get_transactions', params, ckbIndexerUrl);
              const txs = res.objects;
              cursor = res.last_cursor;
              for (const tx of txs) {
                yield tx.tx_hash
              }
              if (txs.length < sizeLimit) {
                break;
              }
            }
          },
        };
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public async request(method: string, params?: any, ckbIndexerUrl: string = this.ckbIndexerUrl): Promise<any> {
    const data = {
      id: 0,
      jsonrpc: '2.0',
      method,
      params,
    };
    const res = await axios.post(ckbIndexerUrl, data);
    if (res.status !== 200) {
      throw new Error(`indexer request failed with HTTP code ${res.status}`);
    }
    if (res.data.error !== undefined) {
      throw new Error(`indexer request rpc failed with error: ${JSON.stringify(res.data.error)}`);
    }
    return res.data.result;
  }

  public async getCells(
    searchKey: SearchKey,
    terminator: Terminator = DefaultTerminator,
    { sizeLimit = 0x100, order = Order.asc }: { sizeLimit?: number; order?: Order } = {},
  ): Promise<Cell[]> {
    const infos: Cell[] = [];
    let cursor: string | undefined;
    const index = 0;
    while (true) {
      const params = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
      const res: GetLiveCellsResult = await this.request('get_cells', params);
      const liveCells = res.objects;
      cursor = res.last_cursor;
      logger.debug('liveCells', liveCells[liveCells.length - 1]);
      for (const liveCell of liveCells) {
        const cell: Cell = {
          cell_output: liveCell.output,
          data: liveCell.output_data,
          out_point: liveCell.out_point,
          block_number: liveCell.block_number,
        };
        const { stop, push } = terminator(index, cell);
        if (push) {
          infos.push(cell);
        }
        if (stop) {
          return infos;
        }
      }
      if (liveCells.length < sizeLimit) {
        break;
      }
    }
    return infos;
  }

  running(): boolean {
    return true;
  }

  start(): void {
    logger.debug('ckb indexer start');
  }

  startForever(): void {
    logger.debug('ckb indexer startForever');
  }

  stop(): void {
    logger.debug('ckb indexer stop');
  }

  //  eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribe(): NodeJS.EventEmitter {
    throw new Error('unimplemented');
  }

  subscribeMedianTime(): NodeJS.EventEmitter {
    throw new Error('unimplemented');
  }
}

export class CellCollector {
  indexer: Indexer
  queries: QueryOptions
  constructor(indexer: Indexer, queries: QueryOptions) {
    this.indexer = indexer
    this.queries = queries
  }

  collect() {
    return this.indexer.collector(this.queries).collect()
  }
}

export class TransactionCollector {
  indexer: Indexer
  queries: QueryOptions
  constructor(indexer: Indexer, queries: QueryOptions) {
    this.indexer = indexer
    this.queries = queries
  }

  async getTransactionHashes() {
    const transactionCollector = this.indexer.txCollector(this.queries)
    const fetchedTxHashes: string[] = []
    for await (const txHash of transactionCollector.collect()) {
      fetchedTxHashes.push(txHash)
    }
    return fetchedTxHashes
  }
}
