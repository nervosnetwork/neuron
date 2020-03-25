import getDAOCellStatus, { CellStatus } from 'utils/getDAOCellStatus'
import fixtures from './fixtures.json'

describe('Test getDAOCellStatus', () => {
  const fixtureTable = Object.entries(fixtures).map(([name, fixture]) => [name, fixture])

  test.each(fixtureTable)('%s', (_name: string, { params, expected }: any) => {
    const actual = getDAOCellStatus(params)
    expect(actual).toEqual(CellStatus[expected])
  })
})
