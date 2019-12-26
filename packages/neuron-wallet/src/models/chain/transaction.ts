import { CellDepInterface, CellDep } from './cell-dep';
import Input, { InputInterface } from './input'
import Output, { OutputInterface } from './output'
import { WitnessArgsInterface, WitnessArgs } from './witness-args'

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
    this._cellDeps = cellDeps?.map(cd => cd.constructor.name === "Object" ? new CellDep(cd) : cd) as CellDep[] || []
    this._headerDeps = headerDeps || []
    this._inputs = inputs?.map(i => i.constructor.name === 'Object' ? new Input(i) : i) as Input[] || []
    this._outputs = outputs?.map(o => o.constructor.name === 'Object' ? new Output(o) : o) as Output[] || []
    this._outputsData = outputsData || this._outputs.map(o => o.data || '0x')
    this._value = BigInt(value).toString()
    this._witnesses = witnesses?.map(wit => {
      if (typeof wit === 'string') {
        return wit
      }
      return wit.constructor.name === 'Object' ? new WitnessArgs(wit) : (wit as WitnessArgs)
    }) || []
    this._type = type
    this._description = description || ''
    this._status = status
    this._fee = BigInt(fee).toString()
    this._interest = BigInt(interest).toString()
    this._nervosDao = nervosDao || false
    this._blockNumber = blockNumber ? BigInt(blockNumber).toString() : blockNumber
    this._blockHash = blockHash
    this._timestamp = timestamp ? BigInt(timestamp).toString() : timestamp
    this._createdAt = createdAt ? BigInt(createdAt).toString() : createdAt
    this._updatedAt = updatedAt ? BigInt(updatedAt).toString() : updatedAt
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

  public get outputs(): Output[] {
    return this._outputs
  }

  public get outputsData(): string[] {
    return this._outputsData
  }

  public get witnesses(): (WitnessArgs | string)[] {
    return this._witnesses
  }

  public get value(): string | undefined {
    return this._value
  }

  public get fee(): string | undefined {
    return this._fee
  }

  public get interest(): string | undefined {
    return this._interest
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
}

