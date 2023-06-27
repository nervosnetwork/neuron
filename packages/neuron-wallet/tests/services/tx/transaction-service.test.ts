  import os from 'os'
import fs from 'fs'
import path from 'path'
import TransactionService, { SearchType } from '../../../src/services/tx/transaction-service'
import Transaction, { TransactionStatus } from '../../../src/models/chain/transaction'
import { initConnection, saveTransactions, closeConnection, saveAccounts } from '../../setupAndTeardown'
import { keyInfos } from '../../setupAndTeardown/public-key-info.fixture'
import accounts from '../../setupAndTeardown/accounts.fixture'
import transactions from '../../setupAndTeardown/transactions.fixture'
import { getConnection } from 'typeorm'
import HdPublicKeyInfo from '../../../src/database/chain/entities/hd-public-key-info'
import TransactionPersistor, { TxSaveType } from '../../../src/services/tx/transaction-persistor'
import SystemScriptInfo from '../../../src/models/system-script-info'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import Input from '../../../src/models/chain/input'
import OutPoint from '../../../src/models/chain/out-point'

jest.mock('../../../src/models/asset-account-info', () => {
  const originalModule = jest.requireActual('../../../src/models/asset-account-info').default
  return function () {
    return new originalModule('0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5')
  }
})

const getTransactionMock = jest.fn()

jest.mock('../../../src/services/rpc-service', () => {
  return function() {
    return {
      getTransaction: getTransactionMock
    }
  }
})

const ckbRpcExecMock = jest.fn()

jest.mock('@nervosnetwork/ckb-sdk-core', () => {
  return function() {
    return {
      rpc: {
        createBatchRequest() {
          return {
            exec: ckbRpcExecMock
          }
        }
      }
    }
  }
})

function resetMock() {
  getTransactionMock.mockReset()
  ckbRpcExecMock.mockReset()
}

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
      searchValue: '',
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
      const fixtures = [
        ['Mainnet', MAINNET_ADDRESS],
        ['Testnet', TESTNET_ADDRESS],
      ]

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
      tx: undefined,
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
          '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
        ])
      })
    })
  })

  describe('#getCountByLockHashesAndStatus(lockHashList, status)', () => {
    const stubProvider = {
      lockHashList: new Set<string>(),
      status: new Set<TransactionStatus>(),
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
        const actual = await TransactionService.getCountByLockHashesAndStatus(
          stubProvider.lockHashList,
          stubProvider.status
        )
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
        const actual = await TransactionService.getCountByLockHashesAndStatus(
          stubProvider.lockHashList,
          stubProvider.status
        )
        expect(actual).toEqual(new Map())
      })
    })
  })

  describe('#updateDescription(hash, description)', () => {
    const stubProvider = {
      hash: '',
      description: '',
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
        resetMock()
      })

      it('Should update the description', async () => {
        getTransactionMock.mockResolvedValue({ transaction: transactions[0] })
        ckbRpcExecMock.mockResolvedValue([])
        const origin = await TransactionService.get(stubProvider.hash)
        expect(origin!.description).toBe('')
        await TransactionService.updateDescription(stubProvider.hash, stubProvider.description)
        const updated = await TransactionService.get(stubProvider.hash)
        expect(updated!.description).toBe(stubProvider.description)
      })
    })

    describe("When the transaction doesn't exist", () => {
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
      hash: '',
    }

    afterEach(() => {
      stubProvider.hash = ''
    })

    describe('When the transaction exists', () => {
      beforeEach(() => {
        const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a86579f1'
        stubProvider.hash = HASH
        resetMock()
      })

      it('Should return a transaction', async () => {
        getTransactionMock.mockResolvedValue({ transaction: transactions[0] })
        ckbRpcExecMock.mockResolvedValue([])
        const actual = await TransactionService.get(stubProvider.hash)
        expect(actual).not.toBeUndefined()
      })

      it('Get input and outputs from rpc', async () => {
        getTransactionMock.mockResolvedValue({ transaction: Transaction.fromObject(transactions[0]) })
        ckbRpcExecMock.mockResolvedValue([{ transaction: { outputs: [{ capacity: '0x100', lock: transactions[0].inputs[0].lock } ]} }])
        const actual = await TransactionService.get(stubProvider.hash)
        expect(actual).not.toBeUndefined()
        expect(actual?.inputs.length).toBe(transactions[0].inputs.length)
        expect(actual?.inputs[0].capacity).toBe((+'0x100').toString())
      })

      it('Get input and outputs from rpc no tx', async () => {
        getTransactionMock.mockResolvedValue({ transaction: Transaction.fromObject(transactions[0]) })
        ckbRpcExecMock.mockResolvedValue([])
        const actual = await TransactionService.get(stubProvider.hash)
        expect(actual).not.toBeUndefined()
        expect(actual?.inputs.length).toBe(transactions[0].inputs.length)
        expect(actual?.inputs[0].capacity).toBeUndefined()
      })
    })

    describe("When the transaction doesn't exist", () => {
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
      walletID: '',
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
        const actual = await TransactionService.exportTransactions({
          walletID: stubProvider.walletID,
          filePath: stubProvider.filePath,
        })
        expect(actual).toBe(0)
      })
    })
  })

  describe('#getAllByAddresses({ pageNo, pageSize, addresses, walletID }, searchValue)', () => {
    const walletId = 'w3'
    // TODO: validate complex sudt transaction, nervos dao transaction
    const ADDRESSES: string[] = [
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
      'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5',
    ]
    const stubProvider: {
      walletID: string
      pageNo: number
      pageSize: number
      addresses: string[]
      searchValue: string
    } = {
      walletID: walletId,
      pageNo: 1,
      pageSize: 15,
      addresses: ADDRESSES,
      searchValue: '',
    }

    beforeEach(async () => {
      const publicKeyEntities = keyInfos.map(d => HdPublicKeyInfo.fromObject(d))
      await getConnection().manager.save(publicKeyEntities)
    })

    afterEach(() => {
      stubProvider.walletID = walletId
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
        const expectedTxs = [...transactions.slice(0, 4)].reverse()

        expect(actual.totalCount).toBe(expectedTxs.length)
        expect(actual.items.map(tx => tx.hash)).toEqual(expectedTxs.map(tx => tx.hash))
        expect(actual.items.map(tx => tx.type)).toEqual(['create', 'receive', 'receive', 'receive'])
        expect(actual.items.map(tx => tx.assetAccountType)).toEqual(['CKB', undefined, undefined, undefined])
        expect(actual.items.map(tx => tx.value)).toEqual(['14200000000', '14200000000', '100000000000', '100000000000'])
        expect(actual.items.map(tx => tx.description)).toEqual(expectedTxs.map(tx => tx.description))
        expect(actual.items.map(tx => !!tx.sudtInfo)).toEqual([false, false, false, false])
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
          expect(actual.items).toEqual(
            expectedTxs.map(tx =>
              expect.objectContaining({
                version: tx.version,
                description: tx.description,
                hash: tx.hash,
                blockHash: undefined,
                blockNumber: null,
                value: '100000000000',
                type: 'receive',
                status: 'success',
                sudtInfo: undefined,
                nervosDao: false,
              })
            )
          )
        })
      })

      describe('When hash misses', () => {
        beforeEach(() => {
          const HASH = '0x230ab250ee0ae681e88e462102e5c01a9994ac82bf0effbfb58d6c11a8657901'
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
        describe('search with wallet adddress', () => {
          beforeEach(() => {
            const ADDRESS = ADDRESSES[1]
            stubProvider.searchValue = ADDRESS
          })

          it('Should return an array of several transactions', async () => {
            const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
            expect(actual.totalCount).toBe(3)
          })
        })
        describe('search with counterparty wallet adddress', () => {
          beforeEach(() => {
            const ADDRESS = 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83'
            stubProvider.searchValue = ADDRESS
          })

          it('Should return an array of several transactions', async () => {
            const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
            expect(actual.totalCount).toBe(2)
          })

          it('find from tx lock', async () => {
            const tx = Transaction.fromObject(transactions[0])
            tx.hash = `0x01${'0'.repeat(62)}`
            const args = `0x${'0'.repeat(42)}`
            const script = SystemScriptInfo.generateSecpScript(args)
            tx.inputs[0].setLock(script)
            await TransactionPersistor.convertTransactionAndSave(tx, TxSaveType.Fetch, new Set([tx.outputs[0].lock.args, tx.outputs[1].lock.args]))
            const actual = await TransactionService.getAllByAddresses(stubProvider, scriptToAddress(script))
            expect(actual.totalCount).toBe(1)
          })
        })
      })

      describe('When address misses', () => {
        beforeEach(() => {
          const ADDRESS = 'ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v'
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
          expect(actual.totalCount).toBe(4)
        })
      })

      describe('When date misses', () => {
        beforeEach(() => {
          const DATE = '1970-01-01'
          stubProvider.searchValue = DATE
        })

        it('Should return an empty array', async () => {
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
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
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
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
          const actual = await TransactionService.getAllByAddresses(stubProvider, stubProvider.searchValue)
          expect(actual.totalCount).toBe(0)
        })
      })
    })
  })

  describe('fillInputFields', () => {
    it('inputs is empty', async () => {
      const inputs: Input[] = []
      //@ts-ignore private-method
      const actual = await TransactionService.fillInputFields(inputs)
      expect(actual).toBe(inputs)
    })
    it('inputs without txHash', async () => {
      const inputs = [
        Input.fromObject({
          previousOutput: null
        })
      ]
      //@ts-ignore private-method
      const actual = await TransactionService.fillInputFields(inputs)
      expect(actual).toBe(inputs)
    })
    it('can not get output', async () => {
      const inputs = [
        Input.fromObject({
          previousOutput: new OutPoint(`0x${'0'.repeat(64)}`, '0x0')
        })
      ]
      ckbRpcExecMock.mockResolvedValueOnce([])
      //@ts-ignore private-method
      const actual = await TransactionService.fillInputFields(inputs)
      expect(actual).toStrictEqual(inputs)
    })
    it('success fill input fields without type', async () => {
      const inputs = [
        Input.fromObject({
          previousOutput: new OutPoint(`0x${'0'.repeat(64)}`, '0x0')
        })
      ]
      const transactionWithStatus = {
        transaction: {
          outputs: [
            {
              capacity: '0x1000',
              lock: {
                codeHash: `0x${'0'.repeat(64)}`,
                hashType: 'data',
                args: '0x00'
              },
            }
          ]
        }
      }
      ckbRpcExecMock.mockResolvedValueOnce([transactionWithStatus])
      //@ts-ignore private-method
      const actual = await TransactionService.fillInputFields(inputs)
      expect(actual[0].capacity).toBe('4096')
      expect(actual[0].lock?.toSDK()).toStrictEqual(transactionWithStatus.transaction.outputs[0].lock)
      expect(actual[0].type).toBeUndefined()
    })
    it('success fill input fields with type', async () => {
      const inputs = [
        Input.fromObject({
          previousOutput: new OutPoint(`0x${'0'.repeat(64)}`, '0x0')
        })
      ]
      const transactionWithStatus = {
        transaction: {
          outputs: [
            {
              capacity: '0x1000',
              lock: {
                codeHash: `0x${'0'.repeat(64)}`,
                hashType: 'data',
                args: '0x00'
              },
              type: {
                codeHash: `0x${'1'.repeat(64)}`,
                hashType: 'data',
                args: '0x01'
              }
            }
          ]
        }
      }
      ckbRpcExecMock.mockResolvedValueOnce([transactionWithStatus])
      //@ts-ignore private-method
      const actual = await TransactionService.fillInputFields(inputs)
      expect(actual[0].capacity).toBe('4096')
      expect(actual[0].lock?.toSDK()).toStrictEqual(transactionWithStatus.transaction.outputs[0].lock)
      expect(actual[0].type?.toSDK()).toStrictEqual(transactionWithStatus.transaction.outputs[0].type)
    })
  })
})
