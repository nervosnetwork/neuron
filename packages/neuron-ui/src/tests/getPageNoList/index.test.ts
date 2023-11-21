import { describe, test, expect } from '@jest/globals'
import getPageNoList from 'utils/getPageNoList'
import fixtures from './fixtures'

describe('Test getPageNoList', () => {
  const fixtureTable: [string, [number, number], number[]][] = Object.entries(fixtures).map(
    ([name, { params, expected }]) => [name, [params.pageNo, params.count], expected]
  )

  test.each(fixtureTable)('%s', (_name: string, [pageNo, count], expected) => {
    expect.assertions(1)
    const actual = getPageNoList(pageNo, count)
    expect(actual).toEqual(expected)
  })
})
