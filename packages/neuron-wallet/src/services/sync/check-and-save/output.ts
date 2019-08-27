import { Cell } from 'types/cell-types'
import LockUtils from 'models/lock-utils'

export default class CheckOutput {
  private output: Cell

  constructor(output: Cell) {
    this.output = output
    // this.calcLockHash()
  }

  public calcLockHash = async (): Promise<Cell> => {
    if (this.output.lockHash) {
      return this.output
    }

    this.output.lockHash = await LockUtils.lockScriptToHash(this.output.lock)
    return this.output
  }

  public checkLockHash = async (lockHashList: string[]): Promise<boolean | undefined> => {
    await this.calcLockHash()
    return lockHashList.includes(this.output.lockHash!)
  }
}
