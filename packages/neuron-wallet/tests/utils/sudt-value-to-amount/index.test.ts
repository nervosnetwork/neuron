import sudtValueToAmount from '../../../src/utils/sudt-value-to-amount'
import fixtures from './fixtures.json'

describe(`sudt value to amount`, () => {
  const fixtureTable = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const amount = sudtValueToAmount(fixture.value, fixture.decimal)
    expect(amount).toBe(fixture.expected)
  })
})
