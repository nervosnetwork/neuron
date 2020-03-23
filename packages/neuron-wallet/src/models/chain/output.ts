import Script from './script'
import OutPoint from './out-point'
import HexUtils from 'utils/hex'
import TypeChecker from 'utils/type-checker'

// sent: pending transaction's output
// pending: pending transaction's input
export enum OutputStatus {
  Sent = 'sent',
  Live = 'live',
  Pending = 'pending',
  Dead = 'dead',
  Failed = 'failed',
}

// empty string '' means not customized lock / type / data
export interface CustomizedAssetInfo {
  lock: string
  type: string
  data: string
}

export interface DaoCellInfo {
  timestamp: string
  txHash: string
}

export default class Output {
  public capacity: string
  public lock: Script
  public type?: Script | null
  public data: string
  public lockHash: string
  public typeHash?: string
  public outPoint?: OutPoint
  public status?: OutputStatus
  public daoData?: string | null
  public timestamp?: string | null
  public blockNumber?: string | null
  public blockHash?: string | null
  public depositOutPoint?: OutPoint
  public depositTimestamp?: string
  public multiSignBlake160?: string | null

  public customizedAssetInfo?: CustomizedAssetInfo

  // dao infos
  public depositInfo?: DaoCellInfo
  public withdrawInfo?: DaoCellInfo
  public unlockInfo?: DaoCellInfo

  // check hex number
  constructor(
    capacity: string,
    lock: Script,
    type?: Script | null,
    data?: string,
    lockHash?: string,
    typeHash?: string,
    outPoint?: OutPoint,
    status?: OutputStatus,
    daoData?: string | null,
    timestamp?: string | null,
    blockNumber?: string | null,
    blockHash?: string | null,
    depositOutPoint?: OutPoint,
    depositTimestamp?: string,
    multiSignBlake160?: string | null
  ) {
    this.capacity = BigInt(capacity).toString()
    this.lock = lock
    this.type = type
    this.lockHash = lockHash || this.lock.computeHash()
    this.typeHash = typeHash || this.type?.computeHash()
    this.outPoint = outPoint
    this.status = status
    this.daoData = daoData
    this.blockHash = blockHash
    this.depositOutPoint = depositOutPoint
    this.multiSignBlake160 = multiSignBlake160

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
      depositTimestamp,
      multiSignBlake160,
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
      multiSignBlake160?: string | null
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
      depositTimestamp,
      multiSignBlake160
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

  public setLock(value: Script) {
    this.lock = value
    this.lockHash = value.computeHash()
  }

  public setMultiSignBlake160(value: string) {
    this.multiSignBlake160 = value
  }

  public setCustomizedAssetInfo(value: CustomizedAssetInfo) {
    this.customizedAssetInfo = value
  }

  public setOutPoint(value: OutPoint) {
    this.outPoint = value
  }

  public setDepositInfo(value: DaoCellInfo) {
    this.depositInfo = value
  }

  public setWithdrawInfo(value: DaoCellInfo)  {
    this.withdrawInfo = value
  }

  public setUnlockInfo(value: DaoCellInfo) {
    this.unlockInfo = value
  }

  public calculateBytesize(): number {
    let bytesize = 8 + HexUtils.byteLength(this.data) + this.lock.calculateBytesize()
    if (this.type) {
      bytesize += this.type.calculateBytesize()
    }
    return bytesize
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
