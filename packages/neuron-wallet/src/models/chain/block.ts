import BlockHeader from './block-header'
import Transaction from './transaction'

export default class Block {
  public header: BlockHeader
  public transactions: Transaction[]

  constructor(header: BlockHeader, transactions: Transaction[]) {
    this.header = header
    this.transactions = transactions
  }

  public static fromSDK(block: CKBComponents.Block): Block {
    const header = BlockHeader.fromSDK(block.header)
    return new Block(
      header,
      block.transactions.map(tx => Transaction.fromSDK(tx, header))
    )
  }
}
