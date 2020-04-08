import Script from './script'

export default class LiveCell {
  public txHash: string
  public outputIndex: string
  public capacity: string
  public lockHash: string
  public lockHashType: string
  public lockCodeHash: string
  public lockArgs: string
  public typeHash?: string | null
  public typeHashType?: string | null
  public typeCodeHash?: string | null
  public typeArgs?: string | null
  public data: string

  constructor(txHash: string, outputIndex: string, capacity: string, lock: Script, type: Script | null, data: string) {
    this.txHash = txHash;
    this.outputIndex = BigInt(outputIndex).toString();
    this.capacity = BigInt(capacity).toString();
    this.lockHash = lock.computeHash();
    this.lockHashType = lock.hashType;
    this.lockCodeHash = lock.codeHash;
    this.lockArgs = lock.args;
    if (type) {
      this.typeHash = type.computeHash();
      this.typeHashType = type.hashType;
      this.typeCodeHash = type.codeHash;
      this.typeArgs = type.args;
    }
    this.data = data;
  }
}
