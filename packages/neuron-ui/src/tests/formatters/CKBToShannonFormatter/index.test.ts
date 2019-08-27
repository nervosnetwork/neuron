import { CapacityUnit } from 'utils/const'
import { CKBToShannonFormatter } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable = fixtures.map(({ ckb: { amount, unit }, expected }) => [amount, unit, expected])

describe(`Verify CKB to Shannons formatter`, () => {
  test.each(fixtureTable)(`%s %s => %s shannons`, (amount: string, unit: CapacityUnit, expected: string) => {
    expect(CKBToShannonFormatter(amount, unit)).toBe(expected)
  })
})
