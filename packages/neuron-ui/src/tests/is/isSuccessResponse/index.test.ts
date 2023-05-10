import { isSuccessResponse } from 'utils/is'
import fixtures from './fixtures'

const fixtureTable: [string, Parameters<typeof isSuccessResponse>, boolean][] = Object.entries(fixtures).map(
  ([title, { params, expected }]) => [title, [params.res], expected]
)

describe('Test isSuccessResponse', () => {
  test.each(fixtureTable)(`%s`, (_title, [res], expected) => {
    expect.assertions(1)
    const actual = isSuccessResponse(res)
    expect(actual).toBe(expected)
  })
})
