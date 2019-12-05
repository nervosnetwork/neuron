import TransactionFee from '../../src/models/transaction-fee'

describe('TransactionFee', () => {
  it('txFee without carry', () => {
    expect(
      TransactionFee.fee(1035, BigInt(1000))
    ).toEqual(BigInt(1035))
  })

  it('txFee with carry', () => {
    expect(
      TransactionFee.fee(1035, BigInt(900))
    ).toEqual(BigInt(932))
  })
})
