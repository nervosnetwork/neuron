export interface TxUniqueFlag {
  txHash: string
  blockHash: string
}

export class TxUniqueFlagCache {
  private arr: TxUniqueFlag[] = []

  private limit: number

  constructor(limit: number) {
    this.limit = limit
  }

  public push(value: TxUniqueFlag) {
    if (this.includes(value)) {
      return
    }
    this.arr.push(value)
    if (this.arr.length > this.limit) {
      this.arr.shift()
    }
  }

  public includes(value: TxUniqueFlag) {
    return this.arr.some(txPoint => {
      return txPoint.txHash == value.txHash && txPoint.blockHash == value.blockHash
    })
  }

  public length() {
    return this.arr.length
  }
}
