import {
  TransactionCollectorOptions,
  indexer as BaseIndexerModule,
  Output,
  OutPoint,
  TransactionWithStatus,
} from "@ckb-lumos/base";
import {
  SearchKeyFilter,
  CKBIndexerQueryOptions,
  GetTransactionsResult,
  GetTransactionsResults,
  IOType,
  Order,
  TransactionWithIOType,
  GetTransactionRPCResult,
} from "./type";
import { CkbIndexer } from "./indexer";
import {
  generateSearchKey,
  getHexStringBytes,
  instanceOfScriptWrapper,
  requestBatch,
  request,
} from "./services";

interface GetTransactionDetailResult {
  objects: TransactionWithStatus[];
  lastCursor: string | undefined;
}

export class CKBIndexerTransactionCollector extends BaseIndexerModule.TransactionCollector {
  filterOptions: TransactionCollectorOptions;
  constructor(
    public indexer: CkbIndexer,
    public queries: CKBIndexerQueryOptions,
    public CKBRpcUrl: string,
    public options?: TransactionCollectorOptions
  ) {
    super(indexer, queries, options);
    const defaultOptions: TransactionCollectorOptions = {
      skipMissing: false,
      includeStatus: true,
    };
    this.filterOptions = { ...defaultOptions, ...this.options };
  }

  /*
   *lock?: ScriptWrapper.script query by ckb-indexer,ScriptWrapper.ioType filter after get transaction from indexer, ScriptWrapper.argsLen filter after get transaction from rpc;
   *type?:  ScriptWrapper.script query by ckb-indexer,ScriptWrapper.ioType filter after get transaction from indexer, ScriptWrapper.argsLen filter after get transaction from rpc;
   *data?: will not filter
   *argsLen?: filter after get transaction detail;
   *fromBlock?: query by ckb-indexer;
   *toBlock?: query by ckb-indexer;
   *skip?: filter after get transaction from ckb-indexer;;
   *order?: query by ckb-indexer;
   */
  private async getTransactions(
    lastCursor?: string,
  ): Promise<GetTransactionDetailResult> {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      searchKeyFilter.lastCursor = lastCursor;
    }
    let transactionHashList: GetTransactionsResults = {
      objects: [],
      lastCursor: "",
    };
    /*
     * if both lock and type exist,we need search them in independent and then get intersection
     * cause ckb-indexer use searchKey script on each cell but native indexer use lock and type on transaction,
     * and one transaction may have many cells both in input and output, more detail in test 'Test query transaction by both input lock and output type script'
     */

    //if both lock and type, search search them in independent and then get intersection, GetTransactionsResults.lastCursor change to `${lockLastCursor}-${typeLastCursor}`
    if (
      instanceOfScriptWrapper(this.queries.lock) &&
      instanceOfScriptWrapper(this.queries.type)
    ) {
      transactionHashList = await this.getTransactionByLockAndTypeIndependent(
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    } else {
      //query by ScriptWrapper.script,block_range,order
      transactionHashList = await this.indexer.getTransactions(
        generateSearchKey(this.queries),
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    }

    // filter by ScriptWrapper.io_type
    transactionHashList.objects = this.filterByTypeIoTypeAndLockIoType(
      transactionHashList.objects,
      this.queries
    );
    // return if transaction hash list if empty
    if (transactionHashList.objects.length === 0) {
      return {
        objects: [],
        lastCursor: lastCursor,
      };
    }

    let transactionList: TransactionWithIOType[] = await this.getTransactionListFromRpc(
      transactionHashList
    );

    for (const transactionWrapper of transactionList) {
      if (transactionWrapper.ioType === "input") {
        const targetOutPoint: OutPoint =
          transactionWrapper.transaction.inputs[
            parseInt(transactionWrapper.ioIndex)
          ].previous_output;
        const targetCell = await this.getCellByOutPoint(targetOutPoint);
        transactionWrapper.inputCell = targetCell;
      }
    }

    //filter by ScriptWrapper.argsLen
    transactionList = transactionList.filter(
      (transactionWrapper: TransactionWithIOType) => {
        if (
          transactionWrapper.ioType === "input" &&
          transactionWrapper.inputCell
        ) {
          return this.isCellScriptArgsValid(transactionWrapper.inputCell);
        } else {
          const targetCell: Output =
            transactionWrapper.transaction.outputs[
              parseInt(transactionWrapper.ioIndex)
            ];
          return this.isCellScriptArgsValid(targetCell);
        }
      }
    );
    const objects = transactionList.map((tx) => ({
      transaction: tx.transaction,
      tx_status: tx.tx_status,
    }));
    return {
      objects: objects,
      lastCursor: lastCursor,
    };
  }

  private async getTxHashesWithCursor(lastCursor?: string) {
    const searchKeyFilter: SearchKeyFilter = {
      sizeLimit: this.queries.bufferSize,
      order: this.queries.order as Order,
    };
    if (lastCursor) {
      searchKeyFilter.lastCursor = lastCursor;
    }
    let transactionHashList: GetTransactionsResults = {
      objects: [],
      lastCursor: "",
    };
    /*
     * if both lock and type exist,we need search them in independent and then get intersection
     * cause ckb-indexer use searchKey script on each cell but native indexer use lock and type on transaction,
     * and one transaction may have many cells both in input and output, more detail in test 'Test query transaction by both input lock and output type script'
     */

    //if both lock and type, search search them in independent and then get intersection, GetTransactionsResults.lastCursor change to `${lockLastCursor}-${typeLastCursor}`
    if (
      instanceOfScriptWrapper(this.queries.lock) &&
      instanceOfScriptWrapper(this.queries.type)
    ) {
      transactionHashList = await this.getTransactionByLockAndTypeIndependent(
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    } else {
      //query by ScriptWrapper.script,block_range,order
      transactionHashList = await this.indexer.getTransactions(
        generateSearchKey(this.queries),
        searchKeyFilter
      );
      lastCursor = transactionHashList.lastCursor;
    }

    // filter by ScriptWrapper.io_type
    transactionHashList.objects = this.filterByTypeIoTypeAndLockIoType(
      transactionHashList.objects,
      this.queries
    );

    return transactionHashList;
  }

  private async getTransactionByLockAndTypeIndependent(
    searchKeyFilter: SearchKeyFilter
  ): Promise<GetTransactionsResults> {
    const queryWithTypeAdditionOptions = { ...searchKeyFilter };
    const queryWithLockAdditionOptions = { ...searchKeyFilter };
    if (searchKeyFilter.lastCursor) {
      const [lockLastCursor, typeLastCursor] = searchKeyFilter.lastCursor.split(
        "-"
      );
      queryWithLockAdditionOptions.lastCursor = lockLastCursor;
      queryWithTypeAdditionOptions.lastCursor = typeLastCursor;
    }
    const queriesWithoutType = { ...this.queries, type: undefined };
    const transactionByLock = await this.indexer.getTransactions(
      generateSearchKey(queriesWithoutType),
      queryWithTypeAdditionOptions
    );
    const queriesWithoutLock = { ...this.queries, lock: undefined };
    const transactionByType = await this.indexer.getTransactions(
      generateSearchKey(queriesWithoutLock),
      queryWithLockAdditionOptions
    );

    const intersection = (
      transactionList1: GetTransactionsResult[],
      transactionList2: GetTransactionsResult[]
    ) => {
      const result: GetTransactionsResult[] = [];
      transactionList1.forEach((tx1) => {
        const tx2 = transactionList2.find(
          (item) => item.tx_hash === tx1.tx_hash
        );
        if (tx2) {
          // put the output io_type to intersection result, cause output have cells
          const targetTx = tx1.io_type === "output" ? tx1 : tx2;
          // change io_type to both cause targetTx exist both input and output
          result.push({ ...targetTx, io_type: "both" });
        }
      });
      return result;
    };
    let hashList = intersection(
      transactionByType.objects,
      transactionByLock.objects
    );
    const lastCursor =
      transactionByLock.lastCursor + "-" + transactionByType.lastCursor;
    const objects = hashList;
    return { objects, lastCursor };
  }

  private getTransactionListFromRpc = async (
    transactionHashList: GetTransactionsResults
  ) => {
    const getDetailRequestData = transactionHashList.objects.map(
      (hashItem: GetTransactionsResult, index: number) => {
        return {
          id: index,
          jsonrpc: "2.0",
          method: "get_transaction",
          params: [hashItem.tx_hash],
        };
      }
    );
    const transactionList: TransactionWithIOType[] = await requestBatch(
      this.CKBRpcUrl,
      getDetailRequestData
    ).then((response: GetTransactionRPCResult[]) => {
      return response.map(
        (item: GetTransactionRPCResult): TransactionWithIOType => {
          if (!this.filterOptions.skipMissing && !item.result) {
            throw new Error(
              `Transaction ${
                transactionHashList.objects[item.id].tx_hash
              } is missing!`
            );
          }
          const ioType = transactionHashList.objects[item.id].io_type;
          const ioIndex = transactionHashList.objects[item.id].io_index;
          return { ioType, ioIndex, ...item.result };
        }
      );
    });
    return transactionList;
  };

  private getCellByOutPoint = async (output: OutPoint) => {
    const res = await request(
      this.CKBRpcUrl,
      "get_transaction",
      [output.tx_hash]
    );
    return res.transaction.outputs[parseInt(output.index)];
  };

  private isLockArgsLenMatched = (
    args: string | undefined,
    argsLen?: number | "any"
  ) => {
    if (!argsLen) return true;
    if (argsLen === "any") return true;
    if (argsLen === -1) return true;
    return getHexStringBytes(args as string) === argsLen;
  };

  // only valid after pass flow three validate
  private isCellScriptArgsValid = (targetCell: Output) => {
    if (this.queries.lock) {
      let lockArgsLen = instanceOfScriptWrapper(this.queries.lock)
        ? this.queries.lock.argsLen
        : this.queries.argsLen;
      if (!this.isLockArgsLenMatched(targetCell.lock.args, lockArgsLen)) {
        return false;
      }
    }

    if (this.queries.type && this.queries.type !== "empty") {
      let typeArgsLen = instanceOfScriptWrapper(this.queries.type)
        ? this.queries.type.argsLen
        : this.queries.argsLen;
      if (!this.isLockArgsLenMatched(targetCell.type?.args, typeArgsLen)) {
        return false;
      }
    }

    if (this.queries.type && this.queries.type === "empty") {
      if (targetCell.type) {
        return false;
      }
    }

    return true;
  };

  private filterByIoType = (
    inputResult: GetTransactionsResult[],
    ioType: IOType
  ) => {
    if (ioType === "both") {
      return inputResult;
    }
    if (ioType === "input" || ioType === "output") {
      return inputResult.filter(
        (item: GetTransactionsResult) =>
          item.io_type === ioType || item.io_type === "both"
      );
    }
    return inputResult;
  };

  private filterByTypeIoTypeAndLockIoType = (
    inputResult: GetTransactionsResult[],
    queries: CKBIndexerQueryOptions
  ) => {
    let result = inputResult;
    if (instanceOfScriptWrapper(queries.lock) && queries.lock.ioType) {
      result = this.filterByIoType(result, queries.lock.ioType);
    }
    if (instanceOfScriptWrapper(queries.type) && queries.type.ioType) {
      result = this.filterByIoType(result, queries.type.ioType);
    }
    return result;
  };

  async count(): Promise<number> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    let counter = 0;
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor();
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (this.queries.skip && index < this.queries.skip) {
        index++;
        continue;
      }
      counter += 1;
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
    return counter;
  }
  async getTransactionHashes(): Promise<string[]> {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<GetTransactionsResult[]> => {
      const result = await this.getTxHashesWithCursor(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };

    let transactionHashes: string[] = [];
    //skip query result in first query
    let txs = await getTxWithCursor();
    if (txs.length === 0) {
      return [];
    }
    let buffer = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (this.queries.skip && index < this.queries.skip) {
        index++;
        continue;
      }
      if (txs[index]?.tx_hash) {
        transactionHashes.push(txs[index].tx_hash as string);
      }
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
    return transactionHashes;
  }
  async *collect() {
    let lastCursor: undefined | string = undefined;
    const getTxWithCursor = async (): Promise<TransactionWithStatus[]> => {
      const result: GetTransactionDetailResult = await this.getTransactions(
        lastCursor
      );
      lastCursor = result.lastCursor;
      return result.objects;
    };
    //skip query result in first query
    let txs: TransactionWithStatus[] = await getTxWithCursor();
    if (txs.length === 0) {
      return 0;
    }
    let buffer: Promise<TransactionWithStatus[]> = getTxWithCursor();
    let index: number = 0;
    while (true) {
      if (this.queries.skip && index < this.queries.skip) {
        index++;
        continue;
      }
      if (this.filterOptions.includeStatus) {
        yield txs[index];
      } else {
        yield txs[index].transaction;
      }
      index++;
      //reset index and exchange `txs` and `buffer` after count last tx
      if (index === txs.length) {
        index = 0;
        txs = await buffer;
        // break if can not get more txs
        if (txs.length === 0) {
          break;
        }
        buffer = getTxWithCursor();
      }
    }
  }
}
