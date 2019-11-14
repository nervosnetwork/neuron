import calculateGlobalAPC from 'utils/calculateGlobalAPC'
import fixtures from './fixtures'

describe('calculate the global apc', () => {
  const fixtureTable = Object.entries(fixtures).map(([title, { currentTime, genesisTime, expectAPC }]) => [
    title,
    currentTime,
    genesisTime,
    expectAPC,
  ])

  test.each(fixtureTable)(`%s`, async (_title, currentTime, genesisTime, expectAPC) => {
    const apc = await calculateGlobalAPC(currentTime, genesisTime)
    expect(apc).toBe(expectAPC === 0 ? 0 : +expectAPC.toFixed(2))
  })
})
