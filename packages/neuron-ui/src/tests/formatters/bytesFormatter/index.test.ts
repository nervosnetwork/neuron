import { describe, test, expect } from 'vitest'
import { bytesFormatter } from 'utils/formatters'
import fixtures from './fixtures.json'

describe('bytes formatter', () => {
  test.each(fixtures)(`%s => %s`, ({ difficulty, expected }) => {
    expect(bytesFormatter(difficulty)).toBe(expected)
  })
})
