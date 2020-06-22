import os from 'os'
import fs from 'fs'
import path from 'path'
import TransactionService, { SearchType } from '../../../src/services/tx/transaction-service'
import { TransactionStatus } from '../../../src/models/chain/transaction'
import { saveTransactions, initConnection, closeConnection, saveAccounts } from '../../setupAndTeardown'
import accounts from '../../setupAndTeardown/accounts.fixture'
import transactions from '../../setupAndTeardown/transactions.fixture'

describe('Test TransactionService', () => {
  beforeEach(async () => {
    await initConnection()
    await saveAccounts(accounts)
    return saveTransactions(transactions)
  })

  afterEach(() => {
    return closeConnection()
  })

  describe('#filterSearchType(searchValue)', () => {
    it('Should return SearchType.Empty when the search value is empty', () => {
      const actual = TransactionService.filterSearchType('')
      expect(actual).toBe(SearchType.Empty)
    })

    it('Should return SearchType.Address when the search value is an address', () => {
      const MAINNET_ADDRESS = 'ckb1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const TESTNET_ADDRESS = 'ckt1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const ADDRESSES = [MAINNET_ADDRESS, TESTNET_ADDRESS]
      ADDRESSES.forEach(addr => {
        expect(TransactionService.filterSearchType(addr)).toBe(SearchType.Address)
      })
    })

    it('Should return SearchType.TxHash when the search value is a transaction hash', () => {
      const TX_HASH = '0x884c79635976a09d1bee84a4bbcc19454cbeb05e831b1d87cb39e20c73e63833'
      const actual = TransactionService.filterSearchType(TX_HASH)
      expect(actual).toBe(SearchType.TxHash)
    })

    it('Should return SearchType.Date when the search value is a date string', () => {
      const DATE = '2019-02-09'
      const actual = TransactionService.filterSearchType(DATE)
      expect(actual).toBe(SearchType.Date)
    })

    it('Should return SearchType.TokenInfo when the search value is not matched', () => {
      const VALUE = 'unknown'
      const actual = TransactionService.filterSearchType(VALUE)
      expect(actual).toBe(SearchType.TokenInfo)
    })
  })

  describe('#blake160sOfTx(transaction)', () => {
    it('Should return an array of blake160', () => {
      const res = TransactionService.blake160sOfTx(transactions[0])
      expect(res).toEqual([
        '0x36c329ed630d6ce750712a477543672adab57f4c',
        '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
      ])
    })
  })

  describe('#getCountByLockHashesAndStatus(lockHashList, status)', () => {
    it('Should return a map of <lockHash, count> when lockHash and status are both matched', async () => {
      const lockHash = '0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d'
      const lockHashList = new Set([lockHash])
      const status = new Set([TransactionStatus.Success])
      const actual = await TransactionService.getCountByLockHashesAndStatus(lockHashList, status)
      expect(actual).toEqual(new Map([[lockHash, 2]]))
    })

    it('Should return an empty map when either lockHash or status are matched', async () => {
      const lockHash = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const lockHashList = new Set([lockHash])
      const status = new Set([TransactionStatus.Success])
      const actual = await TransactionService.getCountByLockHashesAndStatus(lockHashList, status)
      expect(actual).toEqual(new Map())
    })
  })

  describe('#updateDescription(hash, description)', () => {
    it('Should update the description when the tx exists', async () => {
      const DESCRIPTION = 'new description'
      const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
      const origin = await TransactionService.get(HASH)
      expect(origin!.description).toBe('')
      await TransactionService.updateDescription(HASH, DESCRIPTION)
      const updated = await TransactionService.get(HASH)
      expect(updated!.description).toBe(DESCRIPTION)
    })

    it('Should return undefined when the tx doesn\'t exist', async () => {
      const DESCRIPTION = 'new description'
      const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const actual = await TransactionService.updateDescription(HASH, DESCRIPTION)
      expect(actual).toBeUndefined()
    })
  })

  describe('#get(hash)', () => {
    it('Should return a transaction when the transaction exists', async () => {
      const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
      const actual = await TransactionService.get(HASH)
      expect(actual).not.toBeUndefined()
    })

    it('Should return undefined when the transaction doesn\'t exist', async () => {
      const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      const actual = await TransactionService.get(HASH)
      expect(actual).toBeUndefined()
    })
  })

  describe('#exportTransactions({ walletID, filePath })', () => {
    const filePath = path.resolve(os.tmpdir(), 'export-transaction.csv')
    afterEach(() => {
      fs.unlinkSync(filePath)
    })
    it('Should return the total count when it\'s called successfully', async () => {
      const actual = await TransactionService.exportTransactions({ walletID: 'wallet id', filePath })
      expect(actual).toBe(0)
    })
  })

  describe('#getAllByAddresses({ pageNo, pageSize, addresses, walletID }, searchValue)', () => {
    // TODO: validate complex sudt transaction, nervos dao transaction
    const addresses: string[] = [
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
    ]

    describe('When search without searchValue', () => {
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

    describe('When search with a transaction hash', () => {
      it('Should return an array of a transaction when the transaction hash hits', async () => {
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
      it('Should return an empty array when the transaction hash misses', async () => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a865790f'
        const actual = await TransactionService.getAllByAddresses({ pageNo: 1, pageSize: 15, addresses, walletID: '' }, HASH)

        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    describe('When search with an address', () => {
      it('Should return an array of several transactions when the address hits', async () => {
        const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          ADDRESS
        )
        expect(actual.totalCount).toBe(2)
      })

      it('Should return an empty array when the address misses', async () => {
        const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqs7zmeg8'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          ADDRESS
        )
        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    describe('When search with a date string', () => {
      it('Should return an array of several transactions when the date hits', async () => {
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

      it('Should return an empty array when the date misses', async () => {
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          '1970-01-01'
        )
        expect(actual.totalCount).toBe(0)
        expect(actual.items).toEqual([])
      })
    })

    // TODO: validate after moduling the method
    describe('When search with token info', () => {
      it('Should return an array of several transactions when the token name hits', async () => {
        const TOKEN_NAME = accounts[0].tokenName
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          TOKEN_NAME,
        )
        expect(actual.totalCount).toBe(1)
      })

      it('Should return an array of several transactions when the account name hits', async () => {
        const ACCOUNT_NAME = accounts[0].accountName
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          ACCOUNT_NAME
        )
        expect(actual.totalCount).toBe(1)
      })

      it('Should return an empty array when neither token name nor account name hit', async () => {
        const NAME = 'Non-exist token/account name'
        const actual = await TransactionService.getAllByAddresses(
          { pageNo: 1, pageSize: 15, addresses, walletID: '' },
          NAME,
        )
        expect(actual.totalCount).toBe(0)
      })
    })
  })
})
