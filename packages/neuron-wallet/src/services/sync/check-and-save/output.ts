import { Cell } from '../../../app-types/types'
import LockUtils from '../../../utils/lock-utils'

export default class CheckOutput {
  private output: Cell

  constructor(output: Cell) {
    this.output = output
    this.calcLockHash()
  }

  public calcLockHash = (): Cell => {
    if (this.output.lockHash) {
      return this.output
    }

    this.output.lockHash = LockUtils.lockScriptToHash(this.output.lock)
    return this.output
  }

  public checkLockHash = (lockHashList: string[]): boolean | undefined => {
    return lockHashList.includes(this.output.lockHash!)
  }
}
