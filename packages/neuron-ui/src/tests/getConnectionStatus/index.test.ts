import { describe, test, expect } from '@jest/globals'
import { ConnectionStatus } from 'utils'
import getConnectionStatus from 'utils/getConnectionStatus'
import fixtures from './fixtures.json'

describe('Test getConnectionStatus', () => {
  const fixtureTable: [string, Parameters<typeof getConnectionStatus>, ConnectionStatus][] = Object.entries(
    fixtures
  ).map(([title, { params, expected }]: [string, any]) => [title, params, expected])

  test.each(fixtureTable)(`%s`, (_title, params, expected) => {
    expect.assertions(1)
    expect(getConnectionStatus(params[0])).toBe(expected)
  })
})
