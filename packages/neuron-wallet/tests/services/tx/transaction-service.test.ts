import os from 'os'
import fs from 'fs'
import path from 'path'
import TransactionService, { SearchType } from '../../../src/services/tx/transaction-service'
import { TransactionStatus } from '../../../src/models/chain/transaction'
import { saveTransactions, initConnection, closeConnection, saveAccounts } from '../../setupAndTeardown'
import accounts from '../../setupAndTeardown/accounts.fixture'
import transactions from '../../setupAndTeardown/transactions.fixture'

describe('Test transaction service', () => {
  beforeEach(async () => {
    await initConnection()
    await saveAccounts(accounts)
    return saveTransactions(transactions)
  })

  afterEach(() => {
    return closeConnection()
  })

  describe('Test filter search type', () => {
    it('Should return empty', () => {
      const actual = TransactionService.filterSearchType('')
      expect(actual).toBe(SearchType.Empty)
    })

    it('Should return address', () => {
      const MAINNET_ADDRESS = 'ckb1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const TESTNET_ADDRESS = 'ckt1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const ADDRESSES = [MAINNET_ADDRESS, TESTNET_ADDRESS]
      ADDRESSES.forEach(addr => {
        expect(TransactionService.filterSearchType(addr)).toBe(SearchType.Address)
      })
    })

    it('Should return transaction hash', () => {
      const TX_HASH = '0x884c79635976a09d1bee84a4bbcc19454cbeb05e831b1d87cb39e20c73e63833'
      const actual = TransactionService.filterSearchType(TX_HASH)
      expect(actual).toBe(SearchType.TxHash)
    })

    it('Should return date', () => {
      const DATE = '2019-02-09'
      const actual = TransactionService.filterSearchType(DATE)
      expect(actual).toBe(SearchType.Date)
    })

    it('Should return token info if no value matched', () => {
      const VALUE = 'unknown'
      const actual = TransactionService.filterSearchType(VALUE)
      expect(actual).toBe(SearchType.TokenInfo)
    })
  })

  it('Test blake160sOfTx', () => {
    const res = TransactionService.blake160sOfTx(transactions[0])
    expect(res).toEqual([
      "0x36c329ed630d6ce750712a477543672adab57f4c",
      "0xe2193df51d78411601796b35b17b4f8f2cd85bd0"
    ])
  })

  describe('Test getCountByLockHashesAndStatus', () => {
    it('Should return result', async () => {
      const lockHash = '0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d'
      const lockHashList = new Set([lockHash])
      const status = new Set([TransactionStatus.Success])
      const actual = await TransactionService.getCountByLockHashesAndStatus(lockHashList, status)
      expect(actual).toEqual(new Map([[lockHash, 2]]))
    })
    it('Should return empty', async () => {
      const lockHash = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const lockHashList = new Set([lockHash])
      const status = new Set([TransactionStatus.Success])
      const actual = await TransactionService.getCountByLockHashesAndStatus(lockHashList, status)
      expect(actual).toEqual(new Map())
    })
  })

  describe('Test update transaction description', () => {
    it('Should update the description if tx exists', async () => {
      const DESCRIPTION = 'new description'
      const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
      const origin = await TransactionService.get(HASH)
      expect(origin!.description).toBe('')
      await TransactionService.updateDescription(HASH, DESCRIPTION)
      const updated = await TransactionService.get(HASH)
      expect(updated!.description).toBe(DESCRIPTION)
    })

    it('Should return undefined if tx not exists', async () => {
      const DESCRIPTION = 'new description'
      const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const actual = await TransactionService.updateDescription(HASH, DESCRIPTION)
      expect(actual).toBeUndefined()
    })
  })

  describe('Get a transaction by hash', () => {
    it('Should return a transaction', async () => {
      const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
      const actual = await TransactionService.get(HASH)
      expect(actual).not.toBeUndefined()
    })

    it('Should return empty', async () => {
      const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const actual = await TransactionService.get(HASH)
      expect(actual).toBeUndefined()
    })
  })

  describe('Test exportTransactions', () => {
    const filePath = path.resolve(os.tmpdir(), 'export-transaction.csv')
    afterEach(() => {
      fs.unlinkSync(filePath)
    })
    it('Should return the total count', async () => {
      const actual = await TransactionService.exportTransactions({ walletID: 'wallet id', filePath })
      expect(actual).toBe(0)
    })
  })

  describe('Test get all by addresses', () => {
    // TODO: validate complex sudt transaction, nervos dao transaction
    const addresses: string[] = [
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
    ]

    describe('Search without filter', () => {
      it('Should return transactions', async () => {
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' }
        )
        const expectedTxs = [...transactions].reverse()

        expect(actual.totalCount).toBe(expectedTxs.length)
        expect(actual.items.map(tx => tx.hash)).toEqual(expectedTxs.map(tx => tx.hash))
        expect(actual.items.map(tx => tx.type)).toEqual(['receive', 'receive', 'receive'])
        expect(actual.items.map(tx => tx.value)).toEqual(['14200000000', '100000000000', '100000000000'])
        expect(actual.items.map(tx => tx.description)).toEqual(expectedTxs.map(tx => tx.description))
        expect(actual.items.map(tx => !!tx.sudtInfo)).toEqual([true, false, false])
      })
    })

    describe('Search with transaction hash', () => {
      it('Should return transactions', async () => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
        const actual = await TransactionService.getAllByAddresses({ pageNo: 1, pageSize: 15, addresses, walletID: '' }, HASH)
        const expectedTxs = [transactions[0]]

        expect(actual.totalCount).toBe(expectedTxs.length)
        expect(actual.items).toEqual(expectedTxs.map(tx => expect.objectContaining({
          version: tx.version,
          description: tx.description,
          hash: tx.hash,
          blockHash: undefined,
          blockNumber: null,
          value: '100000000000',
          type: 'receive',

          status: 'success',
          sudtInfo: undefined,
          nervosDao: false
        })))
      })
      it('Should return empty', async () => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a865790f'
        const actual = await TransactionService.getAllByAddresses({ pageNo: 1, pageSize: 15, addresses, walletID: '' }, HASH)

        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    describe('Search with address', () => {
      it('Should return transactions', async () => {
        const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          ADDRESS
        )
        expect(actual.totalCount).toBe(2)
      })

      it('Should return empty', async () => {
        const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqs7zmeg8'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          ADDRESS
        )
        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    describe('Search with date', () => {
      it('Should return transactions', async () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = `${now.getMonth() + 1}`.padStart(2, '0')
        const date = `${now.getDate()}`.padStart(2, '0')
        const DATE = `${year}-${month}-${date}`
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          DATE
        )
        expect(actual.totalCount).toBe(3)
      })

      it('Should return empty', async () => {
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          '1970-01-01'
        )
        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    // TODO: validate after moduling the method
    describe('Search with token info', () => {
      it("Should return transactions", async () => {
        const TOKEN_NAME = 'SUDT Account'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          TOKEN_NAME,
        )
        expect(actual.totalCount).toBe(1)
      })

      it('Should return empty', async () => {
        const TOKEN_NAME = 'Non-exist token name'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          TOKEN_NAME,
        )
        expect(actual.totalCount).toBe(0)
      })
    })
  })
})
