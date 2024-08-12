import { deepCamelizeKeys } from '../../../src/utils/deep-camelize-keys'
import fixtures from './fixtures.json'

describe('test json to hump', () => {
  it('json to hump', () => {
    const result = deepCamelizeKeys(fixtures.value)
    expect(fixtures.expected).toEqual(result)
  })
})
