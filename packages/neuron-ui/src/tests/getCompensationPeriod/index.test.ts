import getCompensationPeriod from 'utils/getCompensationPeriod'
import fixtures from './fixtures.json'

describe('Test getCompensationPeriod', () => {
  test.each(fixtures.map(fixture => [fixture.currentEpochValue, fixture.endEpochValue, fixture.expected]))(
    `%s, %s => %s`,
    (currentEpochValue: number, endEpochValue: number, expected: object) => {
      const actual = getCompensationPeriod({
        currentEpochValue,
        endEpochValue,
      })
      expect(actual).toEqual(expected)
    }
  )
})
