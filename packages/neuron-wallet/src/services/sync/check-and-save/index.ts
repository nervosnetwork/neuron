import { Block } from 'types/cell-types'
import CheckTx from './tx'

export default class CheckAndSave {
  private block: Block
  private lockHashes: string[]
  private url: string

  constructor(block: Block, lockHashes: string[], url: string) {
    this.block = block
    this.lockHashes = lockHashes
    this.url = url
  }

  public process = async (): Promise<boolean[]> => {
    const txs = this.block.transactions
    let result: boolean[] = []
    for (const tx of txs) {
      const checkTx = new CheckTx(tx, this.url)
      const checkResult = await checkTx.checkAndSave(this.lockHashes)
      result.push(checkResult)
    }
    return result
  }
}
