import scriptToAddress from '../../utils/scriptToAddress'
import fixtures from './fixtures.json'

describe('Test scriptToAddress', () => {
  const fixtureTable: [string, [CKBComponents.Script, boolean], string][] = Object.entries<{
    params: any
    expected: string
  }>(fixtures).map(([title, { params, expected }]) => [title, params, expected])

  test.each(fixtureTable)(`%s`, (_title, params, expected) => {
    expect.assertions(1)
    expect(scriptToAddress(...params)).toEqual(expected)
  })
})
