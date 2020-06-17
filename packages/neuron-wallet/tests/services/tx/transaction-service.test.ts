import TransactionService, { SearchType } from '../../../src/services/tx/transaction-service'

describe('Test transaction service', () => {
  describe('Test filter search type', () => {
    it('Filter of value', () => {
      const actual = TransactionService.filterSearchType('')
      expect(actual).toBe(SearchType.Empty)
    })

    it('Filter of address', () => {
      const MAINNET_ADDRESS = 'ckb1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const TESTNET_ADDRESS = 'ckt1qyqv9w4p6k695wkkg54eex9d3ckv2tj3y0rs6ctv00'
      const ADDRESSES = [MAINNET_ADDRESS, TESTNET_ADDRESS]
      ADDRESSES.forEach(addr => {
        expect(TransactionService.filterSearchType(addr)).toBe(SearchType.Address)
      })
    })

    it('Filter of transaction hash', () => {
      const TX_HASH = '0x884c79635976a09d1bee84a4bbcc19454cbeb05e831b1d87cb39e20c73e63833'
      const actual = TransactionService.filterSearchType(TX_HASH)
      expect(actual).toBe(SearchType.TxHash)
    })

    it('Filter of date', () => {
      const DATE = '2019-02-09'
      const actual = TransactionService.filterSearchType(DATE)
      expect(actual).toBe(SearchType.Date)
    })

    it('Filter of non-match value should return token info', () => {
      const VALUE = 'unknown'
      const actual = TransactionService.filterSearchType(VALUE)
      expect(actual).toBe(SearchType.TokenInfo)
    })
  })
})
