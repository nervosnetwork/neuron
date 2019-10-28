import { TransactionCache } from '../../../src/services/indexer/transaction-cache'
import { TransactionWithStatus } from '../../../src/types/cell-types';

describe('TransactionCache', () => {
  const txWithStatus: TransactionWithStatus = {
    transaction: {
      version: '',
      hash: '',
    },
    txStatus: {
      blockHash: '',
      status: 'committed',
    }
  }

  it('unique', () => {
    const cache = new TransactionCache(10)
    cache.push(txWithStatus)
    cache.push(txWithStatus)
    expect(cache.size()).toEqual(1)
  })

  it('limit', () => {
    const cache = new TransactionCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push({
        transaction: {
          version: '',
          hash: index.toString(),
        },
        txStatus: {
          blockHash: '',
          status: 'committed',
        }
      })
    })

    expect(cache.size()).toEqual(10)
  })

  it('pop head', () => {
    const cache = new TransactionCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push({
        transaction: {
          version: '',
          hash: index.toString(),
        },
        txStatus: {
          blockHash: '',
          status: 'committed',
        }
      })
    })

    const result = Array.from({ length: 10 }).map((_value, index) => {
      return {
        transaction: {
          version: '',
          hash: (index + 10).toString(),
        },
        txStatus: {
          blockHash: '',
          status: 'committed',
        }
      }
    })

    expect(cache.size()).toEqual(10)
    result.map(value => {
      expect(cache.get(value.transaction.hash)).toBeDefined()
    })
  })
})
