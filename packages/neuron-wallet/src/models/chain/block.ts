import BlockHeader from './block-header'
import Transaction from './transaction'

export default class Block {
  constructor(
    public header: BlockHeader,
    public transactions: Transaction[]
  ) {}

  public static fromSDK(block: CKBComponents.Block): Block {
    const header = BlockHeader.fromSDK(block.header)
    return new Block(
      header,
      block.transactions.map(tx => Transaction.fromSDK(tx, header))
    )
  }
}
