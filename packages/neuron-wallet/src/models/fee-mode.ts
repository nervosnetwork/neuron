export default class FeeMode {
  private mode: 'fee' | 'feeRate'

  constructor(feeRate: bigint) {
    if (feeRate > 0) {
      this.mode = 'feeRate'
    } else{
      this.mode = 'fee'
    }
  }

  public isFeeRateMode(): boolean {
    return this.mode === 'feeRate'
  }

  public isFeeMode(): boolean {
    return this.mode === 'fee'
  }
}
