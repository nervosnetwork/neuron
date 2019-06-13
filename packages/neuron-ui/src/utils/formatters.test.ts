import { currencyFormatter, currencyCode } from 'utils/formatters'

describe('formatters', () => {
  it('currencyFormatter', () => {
    const fixtures = [
      {
        source: {
          shannons: '1234567890',
          unit: 'CKB' as currencyCode,
          exchange: '0.000000001',
        },
        target: '1.23456789 CKB',
      },
      {
        source: {
          shannons: '1234567890',
          unit: 'CKB' as currencyCode,
          exchange: '0.00065',
        },
        target: '802,469.1285 CKB',
      },
      {
        source: {
          shannons: '1234567890',
          unit: 'CNY' as currencyCode,
          exchange: '0.00065',
        },
        target: '802,469.1285 CNY',
      },
      {
        source: {
          shannons: '1234567890123456789012345678901234567890123456789012345678901234567890',
          unit: 'CNY' as currencyCode,
          exchange: '0.65',
        },
        target: '802,469,128,580,246,912,858,024,691,285,802,469,128,580,246,912,858,024,691,285,802,469,128.5 CNY',
      },
      {
        source: {
          shannons: '12345678901234567890123456789012345678901234567890123456789012345678901234',
          unit: 'CNY' as currencyCode,
          exchange: '0.65',
        },
        target:
          '8,024,691,285,802,469,128,580,246,912,858,024,691,285,802,469,128,580,246,912,858,024,691,285,802.1 CNY',
      },
    ]
    fixtures.forEach(fixture => {
      const result = currencyFormatter(fixture.source.shannons, fixture.source.unit, fixture.source.exchange)
      expect(result).toBe(fixture.target)
    })
  })
})
