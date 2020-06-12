import toCSVRow from '../../../src/utils/to-csv-row'
import fixtures from './fixtures.json'

describe(`Test generating csv row`, () => {
  const fixtureTable = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const actual = toCSVRow(fixture.data)
    expect(actual).toEqual(fixture.expected)
  })
})
