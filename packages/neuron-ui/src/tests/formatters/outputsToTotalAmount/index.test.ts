import { describe, test, expect } from '@jest/globals'
import { outputsToTotalAmount } from 'utils/formatters'
import fixtures from './fixtures'

const fixtureTable: [string, any, string][] = Object.entries(fixtures).map(([title, { outputs, expected }]) => [
  title,
  outputs,
  expected,
])

describe(`Verify outputs to total amount`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, outputs: any, expected: string) => {
    expect(outputsToTotalAmount(outputs)).toBe(expected)
  })
})
