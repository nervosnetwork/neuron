import os from 'os'
import fs from 'fs'
import path from 'path'
import { initConnection, closeConnection, saveTransactions } from '../../setupAndTeardown/index'
import transactions from '../../setupAndTeardown/transactions.fixture'
import i18n from '../../../src/locales/i18n'
import AddressService from '../../../src/services/addresses'
import exportHistory from '../../../src/utils/export-history'

describe('Test exporting history', () => {
  const WALLET_ID = 'wallet id'
  const MAINNET_CHAIN_TYPE = 'ckb'
  const TESTNET_CHAIN_TYPE = 'ckb_testnet'
  const FILE_PATH = path.join(os.tmpdir(), 'transaction.csv')
  const stubProvider = {
    walletID: WALLET_ID,
    chainType: MAINNET_CHAIN_TYPE,
    filePath: FILE_PATH,
  }

  beforeAll(() => {
    i18n.changeLanguage('en')
  })

  beforeEach(async () => {
    await initConnection()
    return saveTransactions(transactions)
  })

  afterEach(() => {
    try {
      fs.unlinkSync(stubProvider.filePath)
    } catch {
      // ignore
    }
    stubProvider.walletID = WALLET_ID
    stubProvider.chainType = MAINNET_CHAIN_TYPE
    stubProvider.filePath = FILE_PATH
    return closeConnection()
  })

  describe('When wallet id is missing', () => {
    beforeEach(() => {
      stubProvider.walletID = ''
    })

    it("Should throw an error", async () => {
      expect.assertions(1)
      try {
        await exportHistory(stubProvider)
      } catch (err) {
        expect(err).toEqual(new Error('Wallet ID is required'))
      }
    })
  })

  describe('When filePath is missing', () => {
    beforeEach(() => {
      stubProvider.filePath = ''
    })

    it('Should throw an error', async () => {
      expect.assertions(1)
      try {
        await exportHistory(stubProvider)
      } catch (err) {
        expect(err).toEqual(new Error('File Path is required'))
      }
    })
  })

  describe('When file exists', () => {
    const originalExistsSync = fs.existsSync
    const originalUnlinkSync = fs.unlinkSync

    afterAll(() => {
      fs.existsSync = originalExistsSync
      fs.unlinkSync = originalUnlinkSync
    })

    beforeEach(() => {
      fs.existsSync = jest.fn(originalExistsSync).mockReturnValueOnce(true)
      fs.unlinkSync = jest.fn(originalUnlinkSync).mockReturnValue()
    })

    it('Should remove file first', async () => {
      expect.assertions(2)
      await exportHistory(stubProvider)
      expect(fs.existsSync).toHaveBeenCalledWith(stubProvider.filePath)
      expect(fs.unlinkSync).toHaveBeenCalledWith(stubProvider.filePath)
    })
  })

  describe('When no transactions exported', () => {
    describe('When it\'s Mainnet', () => {
      beforeEach(() => {
        stubProvider.chainType = MAINNET_CHAIN_TYPE
      })

      it('Should export table header without sudt column', async () => {
        expect.assertions(2)
        const totalCount = await exportHistory(stubProvider)
        const actual = fs.readFileSync(stubProvider.filePath, 'utf8')
        expect(totalCount).toBe(0)
        expect(actual).toBe('Time,Block Number,Transaction Hash,Transaction Type,CKB Amount,Description\n')
      })
    })

    describe('When it\'s Testnet', () => {
      beforeEach(() => {
        stubProvider.chainType = TESTNET_CHAIN_TYPE
      })

      it('Should export table header containing sudt column', async () => {
        expect.assertions(2)
        const totalCount = await exportHistory(stubProvider)
        const actual = fs.readFileSync(stubProvider.filePath, 'utf8')
        expect(totalCount).toBe(0)
        expect(actual).toBe('Time,Block Number,Transaction Hash,Transaction Type,CKB Amount,UDT Amount,Description\n')
      })
    })
  })

  describe('When several transactions exported', () => {
    const originalAllAddressesByWalletID = AddressService.allAddressesByWalletId

    beforeAll(() => {
      AddressService.allAddressesByWalletId = jest.fn().mockReturnValue([
        'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
        'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txcqqqqtrnpa5'
      ].map(address => ({ address })))
    })

    afterAll(() => {
      AddressService.allAddressesByWalletId = originalAllAddressesByWalletID
    })

    it('Should export table with records', async () => {
      expect.assertions(2)
      const expectedTotalCount = 3
      const totalCount = await exportHistory(stubProvider)
      const actual = fs.readFileSync(stubProvider.filePath, 'utf8')
      expect(totalCount).toBe(expectedTotalCount)
      expect(actual.split('\n')).toHaveLength(expectedTotalCount + 2)
    })
  })
})
