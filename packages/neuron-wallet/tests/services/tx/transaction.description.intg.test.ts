import initConnection from '../../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'
import TxDescription from '../../../src/database/chain/entities/tx-description'
import { get, set } from '../../../src/services/tx/transaction-description'

describe('transaction description service', () => {
  const txs = [
    { walletId: 'w1', txHash: 'hash1', description: 'desc1' },
    { walletId: 'w2', txHash: 'hash2', description: 'desc2' },
    { walletId: 'w3', txHash: 'hash3', description: 'desc3' },
  ]
  beforeAll(async () => {
    await initConnection('')
  })

  afterAll(async () => {
    await getConnection().close()
  })

  beforeEach(async () => {
    await getConnection().synchronize(true)

    const entities = txs.map(tx => {
      const txDesc = new TxDescription()
      txDesc.walletId = tx.walletId
      txDesc.txHash = tx.txHash
      txDesc.description = tx.description
      return txDesc
    })

    await getConnection().manager.save(entities)
  })
  describe('#get', () => {
    let result: any
    describe('when matched txs', () => {
      beforeEach(async () => {
        result = await get(txs[0].walletId, txs[0].txHash)
      })
      it('returns description', () => {
        expect(result).toEqual(txs[0].description)
      })
    })
    describe('when no matched txs', () => {
      beforeEach(async () => {
        result = await get(txs[0].walletId, 'hash4')
      })
      it('return empty string', () => {
        expect(result).toEqual('')
      })
    })
  })
  describe('#set', () => {
    describe('when no matched records', () => {
      const walletId = 'w4'
      const txHash = 'hash3'
      const description = 'desc4'
      beforeEach(async () => {
        await set(walletId, txHash, description)
      })
      it('saves new description', async () => {
        const desc = await get(walletId, txHash)
        expect(desc).toEqual(description)
      })
    })
    describe('when matched a tx', () => {
      const walletId = 'w3'
      const txHash = 'hash3'
      const description = 'desc4'
      beforeEach(async () => {
        await set(walletId, txHash, description)
      })
      it('updates description', async () => {
        const desc = await get(walletId, txHash)
        expect(desc).toEqual(description)
      })
    })
  })
})
