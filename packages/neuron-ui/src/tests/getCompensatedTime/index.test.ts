import getCompensatedTime from 'utils/getCompensatedTime'
import fixtures from './fixtures.json'

describe('Test getCompensatedTime', () => {
  test.each(fixtures.map(fixture => [fixture.depositEpochValue, fixture.currentEpochValue, fixture.expected]))(
    `%s, %s => %s`,
    (depositEpochValue: number, currentEpochValue: number, expected: object) => {
      const actual = getCompensatedTime({
        depositEpochValue,
        currentEpochValue,
      })
      expect(actual).toEqual(expected)
    }
  )
})
