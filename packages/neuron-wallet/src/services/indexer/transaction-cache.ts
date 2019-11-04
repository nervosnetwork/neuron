import { TransactionWithStatus } from "types/cell-types"

export class TransactionCache {
  private limit: number

  private store = new Map<string, TransactionWithStatus>()

  constructor(limit: number) {
    this.limit = limit
  }

  public push(value: TransactionWithStatus) {
    const key = value.transaction.hash

    if (this.store.has(key)) {
      return
    }
    this.store.set(key, value)
    if (this.store.size > this.limit) {
      const firstKey = Array.from(this.store.keys())[0]
      this.store.delete(firstKey)
    }
  }

  public get(key: string): TransactionWithStatus | undefined {
    return this.store.get(key)
  }

  public delete(key: string): boolean {
    return this.store.delete(key)
  }

  public size(): number {
    return this.store.size
  }
}
