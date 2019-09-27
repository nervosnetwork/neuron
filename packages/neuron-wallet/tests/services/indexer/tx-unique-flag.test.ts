import { TxUniqueFlag, TxUniqueFlagCache } from '../../../src/services/indexer/tx-unique-flag'

describe('TxUniqueFlagCache', () => {
  const txUniqueFlag: TxUniqueFlag = {
    txHash: '0x1742426b21175c35cac63f0fb25318e2dd1facd1c02a244caa9144a0e843e08a',
    blockHash: '0x42f917e4c00e39cec94696ee5820b5f79f603bf7a2b7aa7abebf4d13f97110e4',
  }

  it('unique', () => {
    const cache = new TxUniqueFlagCache(10)
    cache.push(txUniqueFlag)
    cache.push(txUniqueFlag)
    expect(cache.length()).toEqual(1)
  })

  it('limit', () => {
    const cache = new TxUniqueFlagCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push({
        blockHash: index.toString(),
        txHash: index.toString(),
      })
    })

    expect(cache.length()).toEqual(10)
  })

  it('pop head', () => {
    const cache = new TxUniqueFlagCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push({
        blockHash: index.toString(),
        txHash: index.toString(),
      })
    })

    const result = Array.from({ length: 10 }).map((_value, index) => {
      return {
        txHash: (index+10).toString(),
        blockHash: (index+10).toString(),
      }
    })

    expect(cache.length()).toEqual(10)
    result.map(value => {
      expect(cache.includes(value)).toBe(true)
    })
  })
})
