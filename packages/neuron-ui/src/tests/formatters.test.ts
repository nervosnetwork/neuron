import { CapacityUnit } from 'utils/const'
import {
  currencyFormatter,
  currencyCode,
  CKBToShannonFormatter,
  shannonToCKBFormatter,
  addressesToBalance,
  outputsToTotalCapacity,
} from 'utils/formatters'

describe(`formatters`, () => {
  it(`currencyFormatter`, () => {
    const fixtures = [
      {
        source: {
          shannons: `1234567890`,
          unit: `CKB` as currencyCode,
          exchange: `0.000000001`,
        },
        target: `1.23456789 CKB`,
      },
      {
        source: {
          shannons: `1234567890`,
          unit: `CKB` as currencyCode,
          exchange: `0.00065`,
        },
        target: `802,469.1285 CKB`,
      },
      {
        source: {
          shannons: `1234567890`,
          unit: `CNY` as currencyCode,
          exchange: `0.00065`,
        },
        target: `802,469.1285 CNY`,
      },
      {
        source: {
          shannons: `1234567890123456789012345678901234567890123456789012345678901234567890`,
          unit: `CNY` as currencyCode,
          exchange: `0.65`,
        },
        target: `802,469,128,580,246,912,858,024,691,285,802,469,128,580,246,912,858,024,691,285,802,469,128.5 CNY`,
      },
      {
        source: {
          shannons: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
          unit: `CNY` as currencyCode,
          exchange: `0.65`,
        },
        target: `8,024,691,285,802,469,128,580,246,912,858,024,691,285,802,469,128,580,246,912,858,024,691,285,802.1 CNY`,
      },
    ]
    fixtures.forEach(fixture => {
      const result = currencyFormatter(fixture.source.shannons, fixture.source.unit, fixture.source.exchange)
      expect(result).toBe(fixture.target)
    })
  })

  describe(`CKB Formatter`, () => {
    it(`CKB to Shannon`, () => {
      const fixtures = [
        {
          source: {
            amount: `1.234`,
            uint: CapacityUnit.CKB,
          },
          target: `123400000`,
        },
        {
          source: {
            amount: `1.23456789`,
            uint: CapacityUnit.CKB,
          },
          target: `123456789`,
        },
        {
          source: {
            amount: `1.0`,
            uint: CapacityUnit.CKB,
          },
          target: `100000000`,
        },
        {
          source: {
            amount: `1.`,
            uint: CapacityUnit.CKB,
          },
          target: `100000000`,
        },
        {
          source: {
            amount: `0.123`,
            uint: CapacityUnit.CKB,
          },
          target: `12300000`,
        },
        {
          source: {
            amount: `.123`,
            uint: CapacityUnit.CKB,
          },
          target: `12300000`,
        },
        {
          source: {
            amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
            uint: CapacityUnit.CKB,
          },
          target: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000`,
        },
        {
          source: {
            amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
            uint: CapacityUnit.CKKB,
          },
          target: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000000`,
        },
        {
          source: {
            amount: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
            uint: CapacityUnit.CKGB,
          },
          target: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000000000000`,
        },
      ]

      fixtures.forEach(fixture => {
        expect(CKBToShannonFormatter(fixture.source.amount, fixture.source.uint)).toBe(fixture.target)
      })
    })

    it(`shannon to CKB`, () => {
      const fixtures = [
        {
          source: `123`,
          target: `0.00000123`,
        },
        {
          source: `12300000`,
          target: `0.123`,
        },
        {
          source: `123000000`,
          target: `1.23`,
        },
        {
          source: `000123000000`,
          target: `1.23`,
        },
        {
          source: `1234567890123456789012345678901234567890123456789012345678901234567890123400000000`,
          target: `12,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678,901,234`,
        },
        {
          source: `12345678901234567890123456789012345678901234567890123456789012345678901234`,
          target: `123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456.78901234`,
        },
        {
          source: `1234567890123456789012345678901234567890123456789012345678901234567890123400`,
          target: `12,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678.901234`,
        },

        {
          source: `-123`,
          target: `-0.00000123`,
        },
        {
          source: `-12300000`,
          target: `-0.123`,
        },
        {
          source: `-123000000`,
          target: `-1.23`,
        },
        {
          source: `-000123000000`,
          target: `-1.23`,
        },
        {
          source: `-1234567890123456789012345678901234567890123456789012345678901234567890123400000000`,
          target: `-12,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678,901,234`,
        },
        {
          source: `-12345678901234567890123456789012345678901234567890123456789012345678901234`,
          target: `-123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456.78901234`,
        },
        {
          source: `-1234567890123456789012345678901234567890123456789012345678901234567890123400`,
          target: `-12,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890,123,456,789,012,345,678.901234`,
        },
        {
          source: `0`,
          target: `0`,
        },
        {
          source: `-0`,
          target: `0`,
        },
        {
          source: ``,
          target: `0`,
        },
      ]

      fixtures.forEach(fixture => {
        expect(shannonToCKBFormatter(fixture.source)).toBe(fixture.target)
      })
    })

    it('addresses to balance', () => {
      const fixture = [
        {
          address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1',
          identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcb',
          description: 'description',
          type: 0 as 0 | 1,
          txCount: 0,
          balance: '100',
          index: 0,
        },
        {
          address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j3',
          identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcb',
          description: 'description',
          type: 0 as 0 | 1,
          txCount: 123,
          balance: '10000',
          index: 1,
        },
        {
          address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j2',
          identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcd',
          description: 'description',
          type: 1 as 0 | 1,
          txCount: 0,
          balance: '200',
          index: 2,
        },
        {
          address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2jd',
          identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcd',
          description: 'description',
          type: 1 as 0 | 1,
          txCount: 123,
          balance: '10000',
          index: 3,
        },
      ]
      expect(addressesToBalance(fixture)).toBe('20300')
    })

    it('outputsToTotalCapacity', () => {
      const fixture: any = [
        {
          amount: '100',
          unit: 'CKB',
        },
        {
          amount: '10000',
          unit: 'CKB',
        },
        {
          amount: '200',
          unit: 'CKB',
        },
        {
          amount: '10000',
          unit: 'CKB',
        },
      ]
      expect(outputsToTotalCapacity(fixture)).toBe('20300')
    })
  })
})
