import { verifyTransactionOutputs } from 'utils/validators'
import fixtures from './fixture'

const fixtureTable = Object.entries(fixtures).map(([title, { outputs, expected }]) => [title, outputs, expected])

describe(`Verify transaction outputs`, () => {
  test.each(fixtureTable)(`%s`, (_title: string, outputs: { address: string; amount: string }[], expected: boolean) => {
    expect(verifyTransactionOutputs(outputs)).toBe(expected)
  })
})
