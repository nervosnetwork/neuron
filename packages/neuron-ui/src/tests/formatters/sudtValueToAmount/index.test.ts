import { sudtValueToAmount } from 'utils/formatters'
import fixtures from './fixtures'

describe(`sudt value to amount`, () => {
  const fixtureTable = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const amount = sudtValueToAmount(fixture.value, fixture.decimal)
    expect(amount).toBe(fixture.expected)
    const amountWithSign = sudtValueToAmount(fixture.value, fixture.decimal, true)
    expect(amountWithSign).toBe(`+${fixture.expected}`)
  })
})
