import { ScriptInterface, Script } from './script'
import { OutPointInterface } from './out-point'
import OutPoint from './out-point'
import HexUtils from '../../utils/hex';

export interface OutputInterface {
  capacity: string
  data?: string
  lock: ScriptInterface
  type?: ScriptInterface | null
  outPoint?: OutPointInterface
  status?: string
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
  private _status?: string
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
    outPoint,
    status,
    lockHash,
    typeHash,
    daoData,
    timestamp,
    blockNumber,
    blockHash,
    depositOutPoint,
    depositTimestamp
  }: OutputInterface) {
    this._capacity = BigInt(capacity).toString()
    this._data = data
    this._lock = lock.constructor.name === 'Object' ? new Script(lock) : (lock as Script)
    this._type = type?.constructor.name === 'Object' ? new Script(type) : (type as Script)
    this._outPoint = outPoint?.constructor.name === 'Object' ? new OutPoint(outPoint) : (outPoint as OutPoint)
    this._status = status
    this._lockHash = lockHash
    this._typeHash = typeHash
    this._daoData = daoData
    this._timestamp = BigInt(timestamp).toString()
    this._blockNumber = BigInt(blockNumber).toString()
    this._blockHash = blockHash
    this._depositOutPoint = depositOutPoint?.constructor.name === 'Object' ? new OutPoint(depositOutPoint) : (depositOutPoint as OutPoint)
    this._depositTimestamp = BigInt(depositTimestamp).toString()
  }

  // getter
  public get capacity(): string {
    return this._capacity
  }

  public get data(): string | undefined {
    return this._data
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

  public get status(): string | undefined {
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

  public get depositTimestamp(): string | undefined {
    return this._depositTimestamp
  }

  public toSDK(): CKBComponents.CellOutput {
    return {
      capacity: HexUtils.toHex(this.capacity),
      lock: this.lock.toSDK(),
      type: this.type ? this.type.toSDK() : undefined
    }
  }

  public static fromSDK(output: CKBComponents.CellOutput): Output {
    return new Output({
      capacity: output.capacity,
      lock: Script.fromSDK(output.lock),
      type: output.type ? Script.fromSDK(output.type) : undefined,
    })
  }
}

export default Output
