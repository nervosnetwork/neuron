import { CellDepInterface, CellDep } from './cell-dep'
import Input, { InputInterface } from './input'
import Output, { OutputInterface } from './output'
import { WitnessArgsInterface, WitnessArgs } from './witness-args'
import HexUtils from 'utils/hex'
import { serializeWitnessArgs, rawTransactionToHash } from '@nervosnetwork/ckb-sdk-utils'
import { BlockHeaderInterface, BlockHeader } from './block-header'
import TypeCheckerUtils from 'utils/type-checker'

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export interface TransactionWithoutHashInterface {
  version: string
  cellDeps?: CellDepInterface[]
  headerDeps?: string[]
  inputs?: InputInterface[]
  outputs?: OutputInterface[]
  outputsData?: string[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: (WitnessArgsInterface | string)[]
  type?: string
  description?: string
  status?: TransactionStatus
  createdAt?: string
  updatedAt?: string
  fee?: string
  interest?: string
  nervosDao?: boolean
}

export interface TransactionInterface extends TransactionWithoutHashInterface {
  hash: string
}

export class TransactionWithoutHash implements TransactionWithoutHashInterface {
  private _version: string
  private _cellDeps: CellDep[] = []
  private _headerDeps: string[] = []
  private _inputs: Input[] = []
  private _outputs: Output[] = []
  private _outputsData: string[] = []
  private _witnesses: (WitnessArgs | string)[] = []

  private _value?: string
  private _fee?: string
  private _interest?: string

  private _type?: string
  private _status?: TransactionStatus
  private _description: string = '' // Default to ''

  private _nervosDao: boolean = false // Default to false

  private _blockNumber?: string
  private _blockHash?: string
  private _timestamp?: string

  private _createdAt?: string
  private _updatedAt?: string

  constructor({
    version,
    cellDeps,
    headerDeps,
    inputs,
    outputs,
    outputsData,
    value,
    witnesses,
    type,
    description = '',
    status,
    fee,
    interest,
    nervosDao = false,
    blockNumber,
    blockHash,
    timestamp,
    createdAt,
    updatedAt
  }: TransactionWithoutHashInterface) {
    this._version = BigInt(version).toString()
    this._cellDeps = cellDeps?.map(cd => cd instanceof CellDep ? cd : new CellDep(cd)) || []
    this._headerDeps = headerDeps || []
    this._inputs = inputs?.map(i => i instanceof Input ? i : new Input(i)) || []
    this._outputs = outputs?.map(o => o instanceof Output ? o : new Output(o)) || []
    this._outputsData = outputsData || this._outputs.map(o => o.data || '0x')
    this._value = value ? BigInt(value).toString() : value
    this._witnesses = witnesses?.map(wit => {
      if (typeof wit === 'string') {
        return wit
      }
      return wit instanceof WitnessArgs ? wit : new WitnessArgs(wit)
    }) || []
    this._type = type
    this._description = description || ''
    this._status = status
    this._fee = fee ? BigInt(fee).toString() : fee
    this._interest = interest ? BigInt(interest).toString() : interest
    this._nervosDao = nervosDao || false
    this._blockNumber = blockNumber ? BigInt(blockNumber).toString() : blockNumber
    this._blockHash = blockHash
    this._timestamp = timestamp ? BigInt(timestamp).toString() : timestamp
    this._createdAt = createdAt ? BigInt(createdAt).toString() : createdAt
    this._updatedAt = updatedAt ? BigInt(updatedAt).toString() : updatedAt

    TypeCheckerUtils.hashChecker(...this._headerDeps, this._blockHash)
    TypeCheckerUtils.numberChecker(
      this._version,
      this._value,
      this._fee,
      this._interest,
      this._blockNumber,
      this._timestamp,
      this._createdAt,
      this._updatedAt
    )
  }

  public get version(): string {
    return this._version
  }

  public get cellDeps(): CellDep[] {
    return this._cellDeps
  }

  public get headerDeps(): string[] {
    return this._headerDeps
  }

  public get inputs(): Input[] {
    return this._inputs
  }

  public set inputs(value: Input[]) {
    this._inputs = value
  }

  public get outputs(): Output[] {
    return this._outputs
  }

  public set outputs(value: Output[]) {
    this._outputs = value
  }

  public get outputsData(): string[] {
    return this._outputsData
  }

  public get witnesses(): (WitnessArgs | string)[] {
    return this._witnesses
  }

  public set witnesses(value: (WitnessArgs | string)[]) {
    this._witnesses = value
  }

  public get value(): string | undefined {
    return this._value
  }

  public set value(v: string | undefined) {
    this._value = v ? BigInt(v).toString() : v
  }

  public get fee(): string | undefined {
    return this._fee
  }

  public set fee(value: string | undefined) {
    this._fee = value ? BigInt(value).toString() : value
  }

  public get interest(): string | undefined {
    return this._interest
  }

  public set interest(value: string | undefined) {
    this._interest = value ? BigInt(value).toString() : value
  }

  public get type(): string | undefined {
    return this._type
  }

  public get status(): TransactionStatus | undefined {
    return this._status
  }

  public get description(): string {
    return this._description
  }

  public set description(value: string) {
    this._description = value
  }

  public get nervosDao(): boolean {
    return this._nervosDao
  }

  public get blockNumber(): string | undefined {
    return this._blockNumber
  }

  public get blockHash(): string | undefined {
    return this._blockHash
  }

  public get timestamp(): string | undefined {
    return this._timestamp
  }

  public get createdAt(): string | undefined {
    return this._createdAt
  }

  public get updatedAt(): string | undefined {
    return this._updatedAt
  }

  public witnessesAsString(): string[] {
    return this.witnesses.map(wit => {
      if (typeof wit === 'string') {
        return wit
      }
      return serializeWitnessArgs(wit)
    })
  }

  public setBlockHeader(blockHeader: BlockHeader) {
    this._timestamp = blockHeader.timestamp
    this._blockHash = blockHeader.hash
    this._blockNumber = blockHeader.number
  }

  public addOutput(output: Output) {
    this._outputs.push(output)
    this._outputsData.push(output.data || '0x')
  }

  public computeHash(): string {
    return rawTransactionToHash(this.toSDK())
  }

  public toInterface(): TransactionWithoutHashInterface {
    return {
      version: this.version,
      cellDeps: this.cellDeps.map(cd => cd.toInterface()),
      headerDeps: this.headerDeps,
      inputs: this.inputs.map(i => i.toInterface()),
      outputs: this.outputs.map(o => o.toInterface()),
      outputsData: this.outputsData,
      witnesses: this.witnesses.map(wit => {
        if (typeof wit === 'string') {
          return wit
        }
        return wit.toInterface()
      }),
      value: this.value,
      fee: this.fee,
      interest: this.interest,
      type: this.type,
      status: this.status,
      description: this.description,
      nervosDao: this.nervosDao,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  public toSDK(): CKBComponents.RawTransaction {
    return {
      version: HexUtils.toHex(this.version),
      inputs: this.inputs.map(i => i.toSDK()),
      outputs: this.outputs.map(o => o.toSDK()),
      cellDeps: this.cellDeps.map(cd => cd.toSDK()),
      headerDeps: this.headerDeps,
      outputsData: this.outputsData,
      witnesses: this.witnessesAsString(),
    }
  }

  public static fromSDK(tx: CKBComponents.RawTransaction, blockHeader?: BlockHeaderInterface): TransactionWithoutHash {
    return new TransactionWithoutHash({
      version: tx.version,
      cellDeps: tx.cellDeps.map(cd => CellDep.fromSDK(cd)),
      headerDeps: tx.headerDeps,
      witnesses: tx.witnesses,
      inputs: tx.inputs.map(i => Input.fromSDK(i)),
      outputs: tx.outputs.map(o => Output.fromSDK(o)),
      outputsData: tx.outputsData,
      timestamp: blockHeader?.timestamp,
      blockNumber: blockHeader?.number,
      blockHash: blockHeader?.hash
    })
  }
}

export class Transaction extends TransactionWithoutHash implements TransactionInterface {
  private _hash: string

  constructor(params: TransactionInterface) {
    super(params)
    this._hash = params.hash
  }

  public get hash(): string {
    return this._hash
  }

  public toInterface(): TransactionInterface {
    return {
      hash: this.hash,
      ...super.toInterface(),
    }
  }

  public toSDK(): CKBComponents.Transaction {
    return {
      hash: this.hash,
      ...super.toSDK(),
    }
  }

  public static fromSDK(tx: CKBComponents.Transaction, blockHeader?: BlockHeaderInterface): Transaction {
    return new Transaction({
      hash: tx.hash,
      ...super.fromSDK(tx, blockHeader).toInterface(),
    })
  }
}

