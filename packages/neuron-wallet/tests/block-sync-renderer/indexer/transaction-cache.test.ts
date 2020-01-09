import { TransactionCache } from '../../../src/block-sync-renderer/indexer/transaction-cache'
import TransactionWithStatus from '../../../src/models/chain/transaction-with-status'
import TxStatus, { TxStatusType } from '../../../src/models/chain/tx-status'
import Transaction from '../../../src/models/chain/transaction'

describe('TransactionCache', () => {
  const txWithStatus = new TransactionWithStatus(
    Transaction.fromObject({ version: '', hash: '' }),
    new TxStatus('', TxStatusType.Committed)
  )

  it('unique', () => {
    const cache = new TransactionCache(10)
    cache.push(txWithStatus)
    cache.push(txWithStatus)
    expect(cache.size()).toEqual(1)
  })

  it('limit', () => {
    const cache = new TransactionCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push(new TransactionWithStatus(
        Transaction.fromObject({ version: '', hash: index.toString() }),
        new TxStatus('', TxStatusType.Committed)
      ))
    })

    expect(cache.size()).toEqual(10)
  })

  it('pop head', () => {
    const cache = new TransactionCache(10)
    Array.from({ length: 20 }).map((_value, index) => {
      cache.push(new TransactionWithStatus(
        Transaction.fromObject({ version: '', hash: index.toString() }),
        new TxStatus('', TxStatusType.Committed)
      ))
    })

    const result = Array.from({ length: 10 }).map((_value, index) => {
      return new TransactionWithStatus(
        Transaction.fromObject({ version: '', hash: (index + 10).toString() }),
        new TxStatus('', TxStatusType.Committed)
      )
    })

    expect(cache.size()).toEqual(10)
    result.map(value => {
      expect(cache.get(value.transaction.hash!)).toBeDefined()
    })
  })
})
