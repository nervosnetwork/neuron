import toCSVRow from '../../../src/utils/to-csv-row'
import fixtures from './fixtures.json'

describe(`Test generating csv row`, () => {
  const fixtureTable: Array<
    [
      string,
      {
        data: {
          tx: {
            hash: string
            timestamp: string
            blockNumber: string
            nervosDao: boolean
            value: string
            description: string
          }
          includeSUDT: boolean
        }
        expected: string
      }
    ]
  > = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const actual = toCSVRow(fixture.data.tx, fixture.data.includeSUDT)
    expect(actual).toEqual(fixture.expected)
  })
})
