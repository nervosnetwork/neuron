import { Block } from 'types/cell-types'
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
    let result: boolean[] = []
    for (const tx of txs) {
      const checkTx = new CheckTx(tx)
      const checkResult = await checkTx.checkAndSave(this.lockHashes)
      result.push(checkResult)
    }
    return result
  }
}
