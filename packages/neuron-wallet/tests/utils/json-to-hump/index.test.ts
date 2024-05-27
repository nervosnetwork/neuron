import { jsonToHump } from '../../../src/utils/json-to-hump'
import fixtures from './fixtures.json'

describe('test json to hump', () => {
  it('json to hump', () => {
    const result = jsonToHump(fixtures.value)
    expect(fixtures.expected).toEqual(result)
  })
})
