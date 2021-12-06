import {
  Cell,
  Hexadecimal,
  HexString,
  QueryOptions,
  Script,
  OutPoint,
  HexNumber,
  Output,
  TransactionWithStatus,
} from "@ckb-lumos/base";
import { EventEmitter } from "events";

export enum ScriptType {
  type = "type",
  lock = "lock",
}

export enum Order {
  asc = "asc",
  desc = "desc",
}

export interface CKBIndexerQueryOptions extends QueryOptions {
  outputDataLenRange?: HexadecimalRange;
  outputCapacityRange?: HexadecimalRange;
  bufferSize?: number;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
  script?: Script;
  output_data_len_range?: HexadecimalRange; //empty
  output_capacity_range?: HexadecimalRange; //empty
  block_range?: HexadecimalRange; //fromBlock-toBlock
}
export interface SearchKey {
  script: Script;
  script_type: ScriptType;
  filter?: SearchFilter;
}

export interface GetLiveCellsResult {
  last_cursor: string;
  objects: IndexerCell[];
}

export interface rpcResponse {
  status: number;
  data: rpcResponseData;
}

export interface rpcResponseData {
  result: string;
  error: string;
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

export declare type Terminator = (
  index: number,
  cell: Cell
) => TerminatorResult;

export type HexNum = string;
export type IOType = "input" | "output" | "both";
export type Bytes32 = string;
export type GetTransactionsResult = {
  block_number: HexNum;
  io_index: HexNum;
  io_type: IOType;
  tx_hash: Bytes32;
  tx_index: HexNum;
};
export interface GetTransactionsResults {
  lastCursor: string | undefined;
  objects: GetTransactionsResult[];
}

export interface GetCellsResults {
  lastCursor: string;
  objects: Cell[];
}

export interface SearchKeyFilter {
  sizeLimit?: number;
  order?: Order;
  lastCursor?: string | undefined;
}

export interface OutputToVerify {
  output: Output;
  outputData: string;
}

export class IndexerEmitter extends EventEmitter {
  lock?: Script;
  type?: Script;
  outputData?: HexString | "any";
  argsLen?: number | "any";
  fromBlock?: bigint;
}

export interface OtherQueryOptions {
  withBlockHash: true;
  ckbRpcUrl: string;
}

export interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: TransactionWithStatus;
}

export interface TransactionWithIOType extends TransactionWithStatus {
  inputCell?: Output;
  ioType: IOType;
  ioIndex: string;
}
