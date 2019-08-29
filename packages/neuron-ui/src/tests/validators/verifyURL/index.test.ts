import { verifyURL } from 'utils/validators'
import { ErrorCode } from 'utils/const'
import fixtures from './fixtures'

const fixtureTable = Object.entries(fixtures).map(([title, { url, expected }]) => [title, url, expected])

describe('Verify URL', () => {
  test.each(fixtureTable)(`%s`, (_title: string, url: string, expected: boolean | { code: ErrorCode }) => {
    expect(verifyURL(url)).toEqual(expected)
  })
})
