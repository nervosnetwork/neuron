import { difficultyFormatter } from 'utils/formatters'
import fixtures from './fixtures.json'

describe('test difficulty formatter', () => {
  test.each(fixtures)(`%s => %s`, ({ difficulty, expected }) => {
    const str = difficultyFormatter(BigInt(difficulty))
    expect(str).toBe(expected)
  })
})
