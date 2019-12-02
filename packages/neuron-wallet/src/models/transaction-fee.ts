export default class TransactionFee {
  public static fee(size: number, feeRate: bigint): bigint {
    const ratio = BigInt(1000)
    const base = BigInt(size) * feeRate
    const fee = base / ratio
    if (fee * ratio < base) {
      return fee + BigInt(1)
    }
    return fee
  }
}
