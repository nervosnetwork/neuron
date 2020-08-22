import os from 'os'
import fs from 'fs'
import path from 'path'
import TransactionService, { SearchType } from '../../../src/services/tx/transaction-service'
import Transaction, { TransactionStatus } from '../../../src/models/chain/transaction'
import { initConnection, saveTransactions, closeConnection, saveAccounts } from '../../setupAndTeardown'
import accounts from '../../setupAndTeardown/accounts.fixture'
import transactions from '../../setupAndTeardown/transactions.fixture'
import { getConnection } from 'typeorm'

describe('Test TransactionService', () => {
  beforeAll(async () => {
    await initConnection()
  })

  afterAll(() => {
    return closeConnection()
  })

  beforeEach(async () => {
    const connection = getConnection()
    await connection.synchronize(true)

    await saveAccounts(accounts)
    return saveTransactions(transactions)
  })

  describe('#filterSearchType(searchValue)', () => {
    const stubProvider = {
      searchValue: ''
    }

    afterEach(() => {
      stubProvider.searchValue = ''
    })

    describe('When the search value is empty', () => {
      beforeEach(() => {
        const SEARCH_VALUE = ''
        stubProvider.searchValue = SEARCH_VALUE
      })

      it('Should return SearchType.Empty', () => {
        const actual = TransactionService.filterSearchType(stubProvider.searchValue)
        expect(actual).toBe(SearchType.Empty)
      })
    })

    describe('When the search value is an address', () => {
      const MAINNET_ADDRESS = 'ckb1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const TESTNET_ADDRESS = 'ckt1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const fixtures = [['Mainnet', MAINNET_ADDRESS], ['Testnet', TESTNET_ADDRESS]]

      test.each(fixtures)('Should return SearchType.Address When search value is a %s address', (_type, addr) => {
        stubProvider.searchValue = addr
        const actual = TransactionService.filterSearchType(stubProvider.searchValue)
        expect(actual).toBe(SearchType.Address)
      })
    })

    describe('When the search value is a transaction hash', () => {
      beforeEach(() => {
        const TX_HASH = '0x884c79635976a09d1bee84a4bbcc19454cbeb05e831b1d87cb39e20c73e63833'
        stubProvider.searchValue = TX_HASH
      })

      it('Should return SearchType.TxHash', () => {
        const actual = TransactionService.filterSearchType(stubProvider.searchValue)
        expect(actual).toBe(SearchType.TxHash)
      })
    })

    describe('When the search value is a date string', () => {
      beforeEach(() => {
        const DATE = '2019-02-09'
        stubProvider.searchValue = DATE
      })

      it('Should return SearchType.Date', () => {
        const actual = TransactionService.filterSearchType(stubProvider.searchValue)
        expect(actual).toBe(SearchType.Date)
      })
    })

    describe('When the search value is not matched', () => {
      beforeEach(() => {
        const VALUE = 'unknown'
        stubProvider.searchValue = VALUE
      })

      it('Should return SearchType.TokenInfo', () => {
        const actual = TransactionService.filterSearchType(stubProvider.searchValue)
        expect(actual).toBe(SearchType.TokenInfo)
      })
    })
  })

  describe('#blake160sOfTx(transaction)', () => {
    const stubProvider: { tx: Transaction | undefined } = {
      tx: undefined
    }

    afterEach(() => {
      stubProvider.tx = undefined
    })

    describe('When tx has 2 outputs', () => {
      beforeEach(() => {
        const TX = transactions[0]
        stubProvider.tx = TX
      })

      it('Should return an array of blake160', () => {
        const res = TransactionService.blake160sOfTx(stubProvider.tx!)
        expect(res).toEqual([
          '0x36c329ed630d6ce750712a477543672adab57f4c',
          '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
        ])
      })
    })
  })

  describe('#getCountByLockHashesAndStatus(lockHashList, status)', () => {
    const stubProvider = {
      lockHashList: new Set<string>(),
      status: new Set<TransactionStatus>()
    }

    afterEach(() => {
      stubProvider.lockHashList = new Set()
      stubProvider.status = new Set()
    })

    describe('When lockHash and status are both matched', () => {
      const LOCK_HASH = '0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d'
      const STATUS = TransactionStatus.Success

      beforeEach(() => {
        stubProvider.lockHashList = new Set([LOCK_HASH])
        stubProvider.status = new Set([STATUS])
      })

      it('Should return a map of <lockHash, count>', async () => {
        const actual = await TransactionService.getCountByLockHashesAndStatus(stubProvider.lockHashList, stubProvider.status)
        expect(actual).toEqual(new Map([[LOCK_HASH, 2]]))
      })
    })

    describe('When either lockHash or status is not matched', () => {
      beforeEach(() => {
        const LOCK_HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        const STATUS = TransactionStatus.Success
        stubProvider.lockHashList = new Set([LOCK_HASH])
        stubProvider.status = new Set([STATUS])
      })

      it('Should return an empty map', async () => {
        const actual = await TransactionService.getCountByLockHashesAndStatus(stubProvider.lockHashList, stubProvider.status)
        expect(actual).toEqual(new Map())
      })
    })
  })

  describe('#updateDescription(hash, description)', () => {
    const stubProvider = {
      hash: '',
      description: ''
    }

    afterEach(() => {
      stubProvider.hash = ''
      stubProvider.description = ''
    })

    describe('When the transaction exists', () => {

      beforeEach(() => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
        const DESCRIPTION = 'new description'
        stubProvider.hash = HASH
        stubProvider.description = DESCRIPTION
      })

      it('Should update the description', async () => {
        const origin = await TransactionService.get(stubProvider.hash)
        expect(origin!.description).toBe('')
        await TransactionService.updateDescription(stubProvider.hash, stubProvider.description)
        const updated = await TransactionService.get(stubProvider.hash)
        expect(updated!.description).toBe(stubProvider.description)
      })
    })

    describe('When the transaction doesn\'t exist', () => {
      beforeEach(() => {
        const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        const DESCRIPTION = 'new description'
        stubProvider.hash = HASH
        stubProvider.description = DESCRIPTION
      })

      it('Should return undefined', async () => {
        const actual = await TransactionService.updateDescription(stubProvider.hash, stubProvider.description)
        expect(actual).toBeUndefined()
      })
    })
  })

  describe('#get(hash)', () => {
    const stubProvider = {
      hash: ''
    }

    afterEach(() => {
      stubProvider.hash = ''
    })

    describe('When the transaction exists', () => {
      beforeEach(() => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
        stubProvider.hash = HASH
      })

      it('Should return a transaction', async () => {
        const actual = await TransactionService.get(stubProvider.hash)
        expect(actual).not.toBeUndefined()
      })
    })

    describe('When the transaction doesn\'t exist', () => {
      beforeEach(() => {
        const HASH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
        stubProvider.hash = HASH
      })

      it('Should return undefined', async () => {
        const actual = await TransactionService.get(stubProvider.hash)
        expect(actual).toBeUndefined()
      })
    })
  })

  describe('#exportTransactions({ walletID, filePath })', () => {
    const stubProvider = {
      filePath: path.resolve(os.tmpdir(), 'export-transaction.csv'),
      walletID: ''
    }

    afterEach(() => {
      fs.unlinkSync(stubProvider.filePath)
      stubProvider.walletID = ''
    })

    describe('When the method is called successfully', () => {
      beforeEach(() => {
        const WALLET_ID = 'wallet id'
        stubProvider.walletID = WALLET_ID
      })

      it('Should return the total count', async () => {
        const actual = await TransactionService.exportTransactions({ walletID: stubProvider.walletID, filePath: stubProvider.filePath })
        expect(actual).toBe(0)
      })
    })
  })

  describe('#getAllByAddresses({ pageNo, pageSize, addresses, walletID }, searchValue)', () => {
    // TODO: validate complex sudt transaction, nervos dao transaction
    const ADDRESSES: string[] = [
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
    ]
    const stubProvider: {
      walletID: string,
      pageNo: number,
      pageSize: number,
      addresses: string[],
      searchValue: string
    } = {
      walletID: '',
      pageNo: 1,
      pageSize: 15,
      addresses: ADDRESSES,
      searchValue: ''
    }

    afterEach(() => {
      stubProvider.walletID = ''
      stubProvider.pageNo = 1
      stubProvider.pageSize = 15
      stubProvider.addresses = ADDRESSES
      stubProvider.searchValue = ''
    })

    describe('When search with an empty search value', () => {
      beforeEach(() => {
        const EMPTY_SEARCH_VALUE = ''
        stubProvider.searchValue = EMPTY_SEARCH_VALUE
      })

      it('Should return transactions', async () => {
        const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
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
      describe('When hash hits', () => {
        beforeEach(() => {
          const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
          stubProvider.searchValue = HASH
        })

        it('Should return an array of a transaction', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
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
      })

      describe('When hash misses', () => {
        beforeEach(() => {
          const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a865790f'
          stubProvider.searchValue = HASH
        })

        it('Should return an empty array', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(0)
          expect(actual.items).toEqual([])
        })
      })
    })

    describe('When search with an address', () => {
      describe('When address hits', () => {
        beforeEach(() => {
          const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
          stubProvider.searchValue = ADDRESS
        })

        it('Should return an array of several transactions', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(2)
        })
      })

      describe('When address misses', () => {
        beforeEach(() => {
          const ADDRESS = 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqs7zmeg8'
          stubProvider.searchValue = ADDRESS
        })

        it('Should return an empty array', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(0)
          expect(actual.items).toEqual([])
        })
      })
    })

    describe('When search with a date string', () => {
      describe('When date hits', () => {
        beforeEach(() => {
          const now = new Date()
          const year = now.getFullYear()
          const month = `${now.getMonth() + 1}`.padStart(2, '0')
          const date = `${now.getDate()}`.padStart(2, '0')
          const DATE = `${year}-${month}-${date}`
          stubProvider.searchValue = DATE
        })

        it('Should return an array of several transactions', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(3)
        })
      })

      describe('When date misses', () => {
        beforeEach(() => {
          const DATE = '1970-01-01'
          stubProvider.searchValue = DATE
        })

        it('Should return an empty array', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue,)
          expect(actual.totalCount).toBe(0)
          expect(actual.items).toEqual([])
        })
      })
    })

    // TODO: validate after moduling the method
    describe('When search with token info', () => {
      describe('When token name hits', () => {
        beforeEach(() => {
          const TOKEN_NAME = accounts[0].tokenName
          stubProvider.searchValue = TOKEN_NAME
        })

        it('Should return an array of several transactions', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue,)
          expect(actual.totalCount).toBe(1)
        })
      })

      describe('When account name hits', () => {
        beforeEach(() => {
          const ACCOUNT_NAME = accounts[0].accountName
          stubProvider.searchValue = ACCOUNT_NAME
        })

        it('Should return an array of several transactions', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(1)
        })
      })

      describe('When neither token name nor account name hit', () => {
        beforeEach(() => {
          const NAME = 'Non-exist token/account name'
          stubProvider.searchValue = NAME
        })

        it('Should return an empty array', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue,)
          expect(actual.totalCount).toBe(0)
        })
      })
    })
  })
})
