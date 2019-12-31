import TypeChecker from "utils/type-checker"

export interface BlockHeaderInterface {
  version: string
  timestamp: string
  hash: string
  parentHash: string
  number: string
  epoch: string
}

export class BlockHeader implements BlockHeaderInterface {
  private _version: string
  private _timestamp: string
  private _hash: string
  private _parentHash: string
  private _number: string
  private _epoch: string

  constructor({ version, timestamp, hash, parentHash, number, epoch }: BlockHeaderInterface) {
    // convert to regular string
    this._version = BigInt(version).toString()
    this._timestamp = BigInt(timestamp).toString()
    this._hash = hash
    this._parentHash = parentHash
    this._number = BigInt(number).toString()
    this._epoch = BigInt(epoch).toString()

    TypeChecker.hashChecker(this._hash, this._parentHash)
    TypeChecker.numberChecker(this._version, this._timestamp, this._number, this._epoch)
  }

  public get version(): string {
    return this._version
  }

  public get timestamp(): string {
    return this._timestamp
  }

  public get hash(): string {
    return this._hash
  }

  public get parentHash(): string {
    return this._parentHash
  }

  public get number(): string {
    return this._number
  }

  public get epoch(): string {
    return this._epoch
  }

  public toInterface(): BlockHeaderInterface {
    return {
      version: this.version,
      timestamp: this.timestamp,
      hash: this.hash,
      parentHash: this.parentHash,
      number: this.number,
      epoch: this.epoch,
    }
  }

  public static fromSDK(sdkHeader: CKBComponents.BlockHeader): BlockHeader {
    return new BlockHeader({
      version: sdkHeader.version,
      timestamp: sdkHeader.timestamp,
      number: sdkHeader.number,
      hash: sdkHeader.hash,
      parentHash: sdkHeader.parentHash,
      epoch: sdkHeader.epoch,
    })
  }
}
