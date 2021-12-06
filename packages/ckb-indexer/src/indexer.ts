import {
  Cell,
  CellCollector,
  HexString,
  Indexer,
  Script,
  Tip,
  Output,
  utils,
  Block,
} from "@ckb-lumos/base";
import { validators } from "ckb-js-toolkit";
import { RPC } from "@ckb-lumos/rpc";
import { request, requestBatch } from "./services";
import { CKBCellCollector } from "./collector";
import { EventEmitter } from "events";
import {
  GetTransactionRPCResult,
  CKBIndexerQueryOptions,
  GetCellsResults,
  GetLiveCellsResult,
  GetTransactionsResult,
  GetTransactionsResults,
  IndexerEmitter,
  Order,
  OutputToVerify,
  SearchKey,
  SearchKeyFilter,
  Terminator,
  OtherQueryOptions,
} from "./type";

const DefaultTerminator: Terminator = () => {
  return { stop: false, push: true };
};

function defaultLogger(level: string, message: string) {
  console.log(`[${level}] ${message}`);
}

/** CkbIndexer.collector will not get cell with block_hash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get block_hash if you need. */
export class CkbIndexer implements Indexer {
  uri: string;
  medianTimeEmitters: EventEmitter[] = [];
  emitters: IndexerEmitter[] = [];
  isSubscribeRunning: boolean = false;
  constructor(public ckbRpcUrl: string, public ckbIndexerUrl: string) {
    this.uri = ckbRpcUrl;
    this.ckbIndexerUrl = ckbIndexerUrl;
  }

  private getCkbRpc(): RPC {
    return new RPC(this.ckbRpcUrl);
  }

  async tip(): Promise<Tip> {
    const res = await request(this.ckbIndexerUrl, "get_tip");
    return res as Tip;
  }

  asyncSleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  async waitForSync(blockDifference = 0): Promise<void> {
    const rpcTipNumber = parseInt(
      (await this.getCkbRpc().get_tip_header()).number,
      16
    );
    while (true) {
      const indexerTipNumber = parseInt((await this.tip()).block_number, 16);
      if (indexerTipNumber + blockDifference >= rpcTipNumber) {
        return;
      }
      await this.asyncSleep(1000);
    }
  }

  /** collector cells without block_hash by default.if you need block_hash, please add OtherQueryOptions.withBlockHash and OtherQueryOptions.ckbRpcUrl.
   * don't use OtherQueryOption if you don't need block_hash,cause it will slowly your collect.
   */
  collector(
    queries: CKBIndexerQueryOptions,
    otherQueryOptions?: OtherQueryOptions
  ): CellCollector {
    return new CKBCellCollector(this, queries, otherQueryOptions);
  }

  private async request(
    method: string,
    params?: any,
    ckbIndexerUrl: string = this.ckbIndexerUrl
  ): Promise<any> {
    return request(ckbIndexerUrl, method, params);
  }

  public async getCells(
    searchKey: SearchKey,
    terminator: Terminator = DefaultTerminator,
    searchKeyFilter: SearchKeyFilter = {}
  ): Promise<GetCellsResults> {
    const infos: Cell[] = [];
    let cursor: string | undefined = searchKeyFilter.lastCursor;
    let sizeLimit = searchKeyFilter.sizeLimit || 100;
    let order = searchKeyFilter.order || Order.asc;
    const index = 0;
    while (true) {
      let params = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
      const res: GetLiveCellsResult = await this.request("get_cells", params);
      const liveCells = res.objects;
      cursor = res.last_cursor;
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
          return {
            objects: infos,
            lastCursor: cursor,
          };
        }
      }
      if (liveCells.length < sizeLimit) {
        break;
      }
    }
    return {
      objects: infos,
      lastCursor: cursor,
    };
  }

  public async getTransactions(
    searchKey: SearchKey,
    searchKeyFilter: SearchKeyFilter = {}
  ): Promise<GetTransactionsResults> {
    let infos: GetTransactionsResult[] = [];
    let cursor: string | undefined = searchKeyFilter.lastCursor;
    let sizeLimit = searchKeyFilter.sizeLimit || 100;
    let order = searchKeyFilter.order || Order.asc;
    for (;;) {
      const params = [searchKey, order, `0x${sizeLimit.toString(16)}`, cursor];
      const res = await this.request("get_transactions", params);
      const txs = res.objects;
      cursor = res.last_cursor as string;
      infos = infos.concat(txs);
      if (txs.length < sizeLimit) {
        break;
      }
    }
    return {
      objects: infos,
      lastCursor: cursor,
    };
  }

  running(): boolean {
    return true;
  }

  start(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to start the ckb-indexer manually"
    );
  }

  startForever(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to startForever the ckb-indexer manually"
    );
  }

  stop(): void {
    defaultLogger(
      "warn",
      "deprecated: no need to stop the ckb-indexer manually"
    );
  }

  subscribe(queries: CKBIndexerQueryOptions): EventEmitter {
    this.isSubscribeRunning = true;
    this.scheduleLoop();
    if (queries.lock && queries.type) {
      throw new Error(
        "The notification machanism only supports you subscribing for one script once so far!"
      );
    }
    if (queries.toBlock !== null || queries.skip !== null) {
      defaultLogger(
        "warn",
        "The passing fields such as toBlock and skip are ignored in subscribe() method."
      );
    }
    let emitter = new IndexerEmitter();
    emitter.argsLen = queries.argsLen;
    emitter.outputData = queries.data;
    if (queries.fromBlock) {
      utils.assertHexadecimal("fromBlock", queries.fromBlock);
    }
    emitter.fromBlock = !queries.fromBlock ? BigInt(0) : BigInt(queries.fromBlock);
    if (queries.lock) {
      validators.ValidateScript(queries.lock);
      emitter.lock = queries.lock as Script;
    } else if (queries.type && queries.type !== "empty") {
      validators.ValidateScript(queries.type);
      emitter.type = queries.type as Script;
    } else {
      throw new Error("Either lock or type script must be provided!");
    }
    this.emitters.push(emitter);
    return emitter;
  }

  private loop() {
    if (!this.isSubscribeRunning) {
      return;
    }
    this.poll()
      .then((timeout) => {
        this.scheduleLoop(timeout);
      })
      .catch((e) => {
        defaultLogger(
          "error",
          `Error occurs: ${e} ${e.stack}, stopping indexer!`
        );
        this.isSubscribeRunning = false;
      });
  }

  private scheduleLoop(timeout = 1) {
    setTimeout(() => {
      this.loop();
    }, timeout);
  }

  private async poll() {
    let timeout = 1;
    const tip = await this.tip();
    const { block_number, block_hash } = tip;
    if (block_number === "0x0") {
      const block: Block = await this.request(
        "get_block_by_number",
        [block_number],
        this.ckbRpcUrl
      );
      await this.publishAppendBlockEvents(block);
    }
    const nextBlockNumber = BigInt(block_number) + BigInt(1);
    const block = await this.request(
      "get_block_by_number",
      [`0x${nextBlockNumber.toString(16)}`],
      this.ckbRpcUrl
    );
    if (block) {
      if (block.header.parent_hash === block_hash) {
        await this.publishAppendBlockEvents(block);
      } else {
        const block: Block = await this.request(
          "get_block_by_number",
          [block_number],
          this.ckbRpcUrl
        );
        await this.publishAppendBlockEvents(block);
      }
    } else {
      const block = await this.request(
        "get_block_by_number",
        [block_number],
        this.ckbRpcUrl
      );
      await this.publishAppendBlockEvents(block);
      timeout = 3 * 1000;
    }
    return timeout;
  }

  private async publishAppendBlockEvents(block: Block) {
    for (const [txIndex, tx] of block.transactions.entries()) {
      const blockNumber = block.header.number;
      // publish changed events if subscribed script exists in previous output cells , skip the cellbase.
      if (txIndex > 0) {
        const requestData = tx.inputs.map((input, index) => {
          return {
            id: index,
            jsonrpc: "2.0",
            method: "get_transaction",
            params: [input.previous_output.tx_hash],
          };
        });

        // batch request by block
        const transactionResponse: OutputToVerify[] = await requestBatch(
          this.ckbRpcUrl,
          requestData
        ).then((response: GetTransactionRPCResult[]) => {
          return response.map(
            (item: GetTransactionRPCResult, index: number) => {
              const cellIndex = tx.inputs[index].previous_output.index;
              const outputCell =
                item.result.transaction.outputs[parseInt(cellIndex)];
              const outputData =
                item.result.transaction.outputs_data[parseInt(cellIndex)];
              return { output: outputCell, outputData } as OutputToVerify;
            }
          );
        });
        transactionResponse.forEach(({ output, outputData }) => {
          this.filterEvents(output, blockNumber, outputData);
        });
      }
      // publish changed events if subscribed script exists in output cells.
      for (const [outputIndex, output] of tx.outputs.entries()) {
        const outputData = tx.outputs_data[outputIndex];
        this.filterEvents(output, blockNumber, outputData);
      }
    }
    await this.emitMedianTimeEvents();
  }

  private filterEvents(
    output: Output,
    blockNumber: string,
    outputData: HexString
  ) {
    for (const emitter of this.emitters) {
      if (
        emitter.lock !== undefined &&
        this.checkFilterOptions(
          emitter,
          blockNumber,
          outputData,
          emitter.lock,
          output.lock
        )
      ) {
        emitter.emit("changed");
      }
    }
    if (output.type !== null) {
      for (const emitter of this.emitters) {
        if (
          emitter.type !== undefined &&
          this.checkFilterOptions(
            emitter,
            blockNumber,
            outputData,
            emitter.type,
            output.type
          )
        ) {
          emitter.emit("changed");
        }
      }
    }
  }

  private checkFilterOptions(
    emitter: IndexerEmitter,
    blockNumber: string,
    outputData: string,
    emitterScript: Script,
    script: Script | undefined
  ) {
    const checkBlockNumber = emitter.fromBlock
      ? emitter.fromBlock <= BigInt(blockNumber)
      : true;
    const checkOutputData =
      emitter.outputData === "any" || !emitter.outputData
        ? true
        : emitter.outputData === outputData;
    const checkScript = !script
      ? true
      : emitterScript.code_hash === script.code_hash &&
        emitterScript.hash_type === script.hash_type &&
        this.checkArgs(emitter.argsLen, emitterScript.args, script.args);
    return checkBlockNumber && checkOutputData && checkScript;
  }

  private checkArgs(
    argsLen: number | "any" | undefined,
    emitterArgs: HexString,
    args: HexString
  ) {
    if (argsLen === -1 || (!argsLen && argsLen !== 0)) {
      return emitterArgs === args;
    } else if (typeof argsLen === "number" && args.length === argsLen * 2 + 2) {
      return args.substring(0, emitterArgs.length) === emitterArgs;
    } else if (argsLen === "any") {
      return args.substring(0, emitterArgs.length) === emitterArgs;
    } else {
      return false;
    }
  }

  private async emitMedianTimeEvents() {
    if (this.medianTimeEmitters.length === 0) {
      return;
    }
    const info = await request(this.ckbRpcUrl, "get_blockchain_info");
    const medianTime = info.median_time;
    for (const medianTimeEmitter of this.medianTimeEmitters) {
      medianTimeEmitter.emit("changed", medianTime);
    }
  }

  subscribeMedianTime(): EventEmitter {
    this.isSubscribeRunning = true;
    this.scheduleLoop();
    const medianTimeEmitter = new EventEmitter();
    this.medianTimeEmitters.push(medianTimeEmitter);
    return medianTimeEmitter;
  }
}
