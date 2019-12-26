import { BlockHeaderInterface, BlockHeader } from './block-header'
import { TransactionInterface, Transaction } from './transaction'

export interface BlockInterface {
  header: BlockHeaderInterface
  transactions: TransactionInterface[]
}

export class Block implements BlockInterface {
  private _header: BlockHeader
  private _transactions: Transaction[]

  constructor({ header, transactions }: BlockInterface) {
    this._header = header.constructor.name === 'Object' ? new BlockHeader(header) : (header as BlockHeader)
    this._transactions = transactions.map(tx => tx.constructor.name === 'Object' ? new Transaction(tx): tx) as Transaction[]
  }

  public get header(): BlockHeader {
    return this._header
  }

  public get transactions(): Transaction[] {
    return this._transactions
  }
}
