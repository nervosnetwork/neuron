import Script from './script'
import OutPoint from './out-point'
import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

export enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
  Failed = 'failed',
}

export default class Output {
  public data: string
  public lockHash: string

  // check hex number
  constructor(
    public capacity: string,
    public lock: Script,
    public type?: Script | null,
    data?: string,
    lockHash?: string,
    public typeHash?: string,
    public outPoint?: OutPoint,
    public status?: OutputStatus,
    public daoData?: string | null,
    public timestamp?: string | null,
    public blockNumber?: string | null,
    public blockHash?: string | null,
    public depositOutPoint?: OutPoint,
    public depositTimestamp?: string
  ) {
    this.capacity = BigInt(capacity).toString()
    this.lockHash = lockHash || this.lock.computeHash()
    this.typeHash = typeHash || this.type?.computeHash()

    // if daoData exists, data should equals to daoData
    this.data = this.daoData || data || '0x'

    this.timestamp = timestamp ? BigInt(timestamp).toString() : timestamp
    this.blockNumber = blockNumber ? BigInt(blockNumber).toString() : blockNumber
    this.depositTimestamp = depositTimestamp ? BigInt(depositTimestamp).toString() : depositTimestamp

    TypeChecker.hashChecker(this.lockHash, this.typeHash, this.blockHash)
    TypeChecker.numberChecker(this.capacity, this.timestamp, this.blockNumber, this.depositTimestamp)
  }

  public static fromObject(
    {
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
    }: {
      capacity: string
      data?: string
      lock: Script
      type?: Script | null
      outPoint?: OutPoint
      status?: OutputStatus
      lockHash?: string
      typeHash?: string
      daoData?: string | null
      timestamp?: string | null
      blockNumber?: string | null
      blockHash?: string | null
      depositOutPoint?: OutPoint
      depositTimestamp?: string
    }
  ): Output {
    return new Output(
      capacity,
      Script.fromObject(lock),
      type ? Script.fromObject(type) : type,
      data,
      lockHash,
      typeHash,
      outPoint ? OutPoint.fromObject(outPoint) : outPoint,
      status,
      daoData,
      timestamp,
      blockNumber,
      blockHash,
      depositOutPoint ? OutPoint.fromObject(depositOutPoint) : depositOutPoint,
      depositTimestamp
    )
  }

  public setCapacity(value: string) {
    this.capacity = value
  }

  public setData(value: string) {
    this.data = value
  }

  public setDaoData(value: string) {
    this.daoData = value
    this.data = value
  }

  public setDepositOutPoint(value: OutPoint) {
    this.depositOutPoint = value
  }

  public setDepositTimestamp(value: string) {
    this.depositTimestamp = value
  }

  public toSDK(): CKBComponents.CellOutput {
    return {
      capacity: HexUtils.toHex(this.capacity),
      lock: this.lock.toSDK(),
      type: this.type ? this.type.toSDK() : this.type
    }
  }

  public static fromSDK(output: CKBComponents.CellOutput): Output {
    return new Output(
      output.capacity,
      Script.fromSDK(output.lock),
      output.type ? Script.fromSDK(output.type) : output.type,
    )
  }
}
