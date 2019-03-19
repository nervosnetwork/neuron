import { getTransactions } from '../src/transaction'

describe('Transaction tests', () => {
  it('getTransactions with out addresses', async () => {
    const result = await getTransactions(null, 1, 2)
    expect(result.totalCount).toBe(2)
  })

  it('getTransactions with addresses', async () => {
    const address = '0xb777827acec016f62798659f5dadd19c85df81a470b3c9d3a2af13e28947b8dc'
    const result = await getTransactions([address], 2, 2)
    expect(result.totalCount).toBe(4)
  })
})
