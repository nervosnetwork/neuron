import { Block } from '../../../app-types/types'
import CheckTx from './tx'

export default class CheckAndSave {
  private block: Block
  private lockHashes: string[]

  constructor(block: Block, lockHashes: string[]) {
    this.block = block
    this.lockHashes = lockHashes
  }

  public process = async (): Promise<boolean[]> => {
    const txs = this.block.transactions
    return Promise.all(
      txs.map(async tx => {
        const checkTx = new CheckTx(tx)
        return checkTx.checkAndSave(this.lockHashes)
      }),
    )
  }
}
