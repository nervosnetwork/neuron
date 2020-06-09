import { getConnection } from 'typeorm'
import { initConnection } from '../../src/database/chain/ormconfig'
import TransactionsService, { SearchType } from '../../src/services/tx/transaction-service'
import TransactionEntity from '../../src/database/chain/entities/transaction'
import { TransactionStatus } from '../../src/models/chain/transaction'

const generateTx = (hash: string, timestamp: string) => {
  const tx = new TransactionEntity()
  tx.hash = hash
  tx.version = '0x0'
  tx.timestamp = timestamp
  tx.status = TransactionStatus.Success
  tx.witnesses = []
  tx.blockNumber = '1'
  tx.blockHash = '0x' + '10'.repeat(32)
  return tx
}

describe('transactions service', () => {
  describe('filterSearchType', () => {
    it('ckt prefix', () => {
      const address = 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83'
      const type = TransactionsService.filterSearchType(address)
      expect(type).toBe(SearchType.Address)
    })

    it('ckb prefix', () => {
      const address = 'ckb1q9gry5zgxmpjnmtrp4kww5r39frh2sm89tdt2l6v234ygf'
      const type = TransactionsService.filterSearchType(address)
      expect(type).toBe(SearchType.Address)
    })

    it('0x prefix', () => {
      const hash = '0x01831733c1b46f461fb49007f8b99449bc40cfdfd0e249da23f178a37139e1a1'
      const type = TransactionsService.filterSearchType(hash)
      expect(type).toBe(SearchType.TxHash)
    })

    it('2019-02-18', () => {
      const date = '2019-02-18'
      const type = TransactionsService.filterSearchType(date)
      expect(type).toBe(SearchType.Date)
    })

    it('-', () => {
      const value = '-'
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.TokenInfo)
    })

    it('empty string', () => {
      const value = ''
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.Empty)
    })

    it('2019-2-18', () => {
      const value = '2019-2-18'
      const type = TransactionsService.filterSearchType(value)
      expect(type).toBe(SearchType.TokenInfo)
    })
  })
  describe('#checkNonExistTransactionsByHashes', () => {
    let txs: TransactionEntity[]
    let hashes: string[]

    beforeAll(async () => {
      await initConnection('0x1234')
    })

    afterAll(async () => {
      await getConnection().close()
    })

    beforeEach(async () => {
      const connection = getConnection()
      await connection.synchronize(true)

      txs = [
        generateTx('0x1', '1'),
        generateTx('0x2', '2'),
        generateTx('0x3', '3'),
      ]
      await getConnection().manager.save(txs)
    })

    describe('when none of the transaction hashes exists', () => {
      beforeEach(() => {
        hashes = ['0x4']
      });
      it('returns all hashes', async () => {
        const nonExistHashes = await TransactionsService.checkNonExistTransactionsByHashes(hashes)
        expect(nonExistHashes).toEqual(hashes)
      });
    });
    describe('when all of the transaction hashes exists', () => {
      beforeEach(() => {
        hashes = txs.map(tx => tx.hash)
      });
      it('returns empty array', async () => {
        const nonExistHashes = await TransactionsService.checkNonExistTransactionsByHashes(hashes)
        expect(nonExistHashes).toEqual([])
      })
    });
    describe('when some of the transaction hashes exists', () => {
      beforeEach(() => {
        hashes = ['0x4', txs[1].hash, '0x5']
      });
      it('returns the ones not exsit', async () => {
        const nonExistHashes = await TransactionsService.checkNonExistTransactionsByHashes(hashes)
        expect(nonExistHashes).toEqual(['0x4', '0x5'])
      })
    });
  });
})
