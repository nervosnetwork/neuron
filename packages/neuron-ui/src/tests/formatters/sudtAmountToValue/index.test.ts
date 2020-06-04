import { sudtAmountToValue } from 'utils/formatters'
import fixtures from './fixtures'

describe(`sudt amount to value`, () => {
  const fixtureTable = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const actual = sudtAmountToValue(fixture.amount, fixture.decimal)
    expect(actual).toBe(fixture.expected)
  })
})
