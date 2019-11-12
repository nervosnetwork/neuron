import { Block } from 'types/cell-types'
import CheckTx from './tx'

export default class CheckAndSave {
  private block: Block
  private lockHashes: string[]
  private url: string
  private daoScriptHash: string

  constructor(block: Block, lockHashes: string[], url: string, daoScriptHash: string) {
    this.block = block
    this.lockHashes = lockHashes
    this.url = url
    this.daoScriptHash = daoScriptHash
  }

  public process = async (): Promise<boolean[]> => {
    const txs = this.block.transactions
    let result: boolean[] = []
    for (const tx of txs) {
      const checkTx = new CheckTx(tx, this.url, this.daoScriptHash)
      const checkResult = await checkTx.checkAndSave(this.lockHashes)
      result.push(checkResult)
    }
    return result
  }
}
