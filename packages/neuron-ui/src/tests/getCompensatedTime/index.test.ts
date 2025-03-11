import { describe, test, expect } from 'vitest'
import getCompensatedTime from 'utils/getCompensatedTime'
import fixtures from './fixtures.json'

describe('Test getCompensatedTime', () => {
  const fixtureTable: [number, number, any][] = fixtures.map(fixture => [
    fixture.depositEpochValue,
    fixture.currentEpochValue,
    fixture.expected,
  ])

  test.each(fixtureTable)(`%s, %s => %s`, (depositEpochValue: number, currentEpochValue: number, expected: object) => {
    const actual = getCompensatedTime({
      depositEpochValue,
      currentEpochValue,
    })
    expect(actual).toEqual(expected)
  })
})
