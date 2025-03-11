import { describe, test, expect } from 'vitest'
import { complexNumberToPureNumber } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable: [string, number][] = fixtures.map(({ value, expected }) => [value, expected])

describe(`Verify currency formatter`, () => {
  test.each(fixtureTable)(`%j => %s`, (value: string, expected: number) => {
    expect(complexNumberToPureNumber(value)).toBe(expected)
  })
})
