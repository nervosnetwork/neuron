import { describe, test, expect } from '@jest/globals'
import getCompensationPeriod from 'utils/getCompensationPeriod'
import fixtures from './fixtures.json'

describe('Test getCompensationPeriod', () => {
  const fixtureTable: [number, number, any][] = fixtures.map(fixture => [
    fixture.currentEpochValue,
    fixture.endEpochValue,
    fixture.expected,
  ])

  test.each(fixtureTable)(`%s, %s => %s`, (currentEpochValue: number, endEpochValue: number, expected: any) => {
    const actual = getCompensationPeriod({
      currentEpochValue,
      endEpochValue,
    })
    expect(actual).toEqual(expected)
  })
})
