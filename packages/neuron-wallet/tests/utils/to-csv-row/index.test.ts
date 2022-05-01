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
            type: string
            timestamp: string
            blockNumber: string
            nervosDao: boolean
            value: string
            description: string
            sudtInfo?: any
          }
        }
        expected: string
      }
    ]
  > = Object.entries(fixtures)
  test.each(fixtureTable)(`%s`, (_name, fixture) => {
    const actual = toCSVRow(fixture.data.tx)
    expect(actual).toEqual(fixture.expected)
  })
})
