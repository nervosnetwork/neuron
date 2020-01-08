import TypeChecker from "utils/type-checker"

export default class BlockHeader {
  constructor(
    public version: string,
    public timestamp: string,
    public hash: string,
    public parentHash: string,
    public number: string,
    public epoch: string
  ) {
    // convert to regular string
    this.version = BigInt(version).toString()
    this.timestamp = BigInt(timestamp).toString()
    this.number = BigInt(number).toString()
    this.epoch = BigInt(epoch).toString()

    TypeChecker.hashChecker(this.hash, this.parentHash)
    TypeChecker.numberChecker(this.version, this.timestamp, this.number, this.epoch)
  }


  public static fromSDK(header: CKBComponents.BlockHeader): BlockHeader {
    return new BlockHeader(
      header.version,
      header.timestamp,
      header.hash,
      header.parentHash,
      header.number,
      header.epoch,
    )
  }
}
