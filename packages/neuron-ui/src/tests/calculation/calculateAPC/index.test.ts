import calculateAPC from 'utils/calculateAPC'
import fixtures from './fixtures.json'

describe('calculate the apc', () => {
  const fixtureTable = Object.entries(fixtures).map(([title, { startYearNumber, endYearNumber, expected }]) => [
    title,
    startYearNumber,
    endYearNumber,
    expected,
  ])

  test.each(fixtureTable)(`%s`, (_title, startYearNumber, endYearNumber, expected) => {
    const apc = calculateAPC({
      startYearNumber,
      endYearNumber,
    })
    expect(apc).toEqual(expected)
  })
})
