import Output from 'models/chain/output'

export default class CheckOutput {
  private output: Output

  constructor(output: Output) {
    this.output = output
  }

  public checkLockHash = (lockHashList: string[]): boolean => {
    return lockHashList.includes(this.output.lockHash!)
  }
}
