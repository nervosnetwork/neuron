import { ScriptInterface, Script } from './script'
import { OutPointInterface } from './out-point'
import OutPoint from './out-point'
import HexUtils from 'utils/hex'

export enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
  Failed = 'failed',
}

export interface OutputInterface {
  capacity: string
  data?: string
  lock: ScriptInterface
  type?: ScriptInterface | null
  outPoint?: OutPointInterface
  status?: OutputStatus
  lockHash?: string
  typeHash?: string
  daoData?: string | null
  timestamp?: string | null
  blockNumber?: string | null
  blockHash?: string | null
  depositOutPoint?: OutPointInterface
  depositTimestamp?: string
}

export class Output implements OutputInterface {
  private _capacity: string
  private _data?: string
  private _lock: Script
  private _type?: Script | null
  private _outPoint?: OutPoint
  private _status?: OutputStatus
  private _lockHash?: string
  private _typeHash?: string
  private _daoData?: string | null
  private _timestamp?: string | null
  private _blockNumber?: string | null
  private _blockHash?: string | null
  private _depositOutPoint?: OutPoint
  private _depositTimestamp?: string

  // check hex number
  constructor({
    capacity,
    data,
    lock,
    type,
    lockHash,
    typeHash,
    outPoint,
    status,
    daoData,
    timestamp,
    blockNumber,
    blockHash,
    depositOutPoint,
    depositTimestamp
  }: OutputInterface) {
    this._capacity = BigInt(capacity).toString()
    this._lock = lock instanceof Script ? lock : new Script(lock)
    this._lockHash = lockHash || this._lock.computeHash()
    this._type = type ? (type instanceof Script ? type : new Script(type)) : type
    this._typeHash = typeHash || this._type?.computeHash()
    this._outPoint = outPoint ? (outPoint instanceof OutPoint ? outPoint : new OutPoint(outPoint)) : outPoint
    this._status = status

    // if daoData exists, data should equals to daoData
    this._daoData = daoData
    this._data = this._daoData || data

    this._timestamp = timestamp ? BigInt(timestamp).toString() : timestamp
    this._blockNumber = blockNumber ? BigInt(blockNumber).toString() : blockNumber
    this._blockHash = blockHash
    this._depositOutPoint = depositOutPoint ?
      (depositOutPoint instanceof OutPoint ? depositOutPoint : new OutPoint(depositOutPoint)) : depositOutPoint
    this._depositTimestamp = depositTimestamp ? BigInt(depositTimestamp).toString() : depositTimestamp
  }

  // getter
  public get capacity(): string {
    return this._capacity
  }

  public set capacity(value: string) {
    this._capacity = value
  }

  public get data(): string | undefined {
    return this._data
  }

  public setData(value: string) {
    this._data = value
  }

  public get lock(): Script {
    return this._lock
  }

  public get type(): Script | null | undefined {
    return this._type
  }

  public get outPoint(): OutPoint | undefined {
    return this._outPoint
  }

  public get status(): OutputStatus | undefined {
    return this._status
  }

  public get lockHash(): string | undefined {
    return this._lockHash
  }

  public get typeHash(): string | undefined {
    return this._typeHash
  }

  public get daoData(): string | null | undefined {
    return this._daoData
  }

  public setDaoData(value: string) {
    this._daoData = value
    this._data = value
  }

  public get timestamp(): string | null | undefined {
    return this._timestamp
  }

  public get blockNumber(): string | null | undefined {
    return this._blockNumber
  }

  public get blockHash(): string | null | undefined {
    return this._blockHash
  }

  public get depositOutPoint(): OutPoint | undefined {
    return this._depositOutPoint
  }

  public setDepositOutPoint(value: OutPoint) {
    this._depositOutPoint = value
  }

  public get depositTimestamp(): string | undefined {
    return this._depositTimestamp
  }

  public setDepositTimestamp(value: string) {
    this._depositTimestamp = value
  }

  public toInterface(): OutputInterface {
    return {
      capacity: this.capacity,
      data: this.data,
      lock: this.lock.toInterface(),
      type: this.type ? this.type.toInterface() : this.type,
      lockHash: this.lockHash,
      typeHash: this.typeHash,
      outPoint: this.outPoint?.toInterface(),
      status: this.status,
      daoData: this.daoData,
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      depositOutPoint: this.depositOutPoint?.toInterface(),
      depositTimestamp: this.depositTimestamp,
    }
  }

  public toSDK(): CKBComponents.CellOutput {
    return {
      capacity: HexUtils.toHex(this.capacity),
      lock: this.lock.toSDK(),
      type: this.type ? this.type.toSDK() : this.type
    }
  }

  public static fromSDK(output: CKBComponents.CellOutput): Output {
    return new Output({
      capacity: output.capacity,
      lock: Script.fromSDK(output.lock),
      type: output.type ? Script.fromSDK(output.type) : output.type,
    })
  }
}

export default Output
