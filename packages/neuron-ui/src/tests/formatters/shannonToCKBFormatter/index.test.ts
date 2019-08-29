import { shannonToCKBFormatter } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable = fixtures.map(({ shannons, expected }) => [shannons, expected])

describe(`Verify shannon to CKB formatter`, () => {
  test.each(fixtureTable)(`%s shannons => %s CKB without sign`, (shannons: string, expected: string) => {
    expect(shannonToCKBFormatter(shannons)).toBe(expected)
  })

  test.each(fixtureTable)(`%s shannons => %s CKB with sign`, (shannons: string, expected: string) => {
    expect(shannonToCKBFormatter(shannons, true)).toBe(+shannons > 0 ? `+${expected}` : expected)
  })
})
