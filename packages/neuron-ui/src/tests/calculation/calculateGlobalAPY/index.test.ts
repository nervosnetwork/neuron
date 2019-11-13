import calculateGlobalAPY from 'utils/calculateGlobalAPY'
import fixtures from './fixtures'

describe('calculate the global apy', () => {
  const fixtureTable = Object.entries(fixtures).map(([title, { currentTime, genesisTime, expectAPY }]) => [
    title,
    currentTime,
    genesisTime,
    expectAPY,
  ])

  test.each(fixtureTable)(`%s`, (_title, currentTime, genesisTime, expectAPY) => {
    const apy = calculateGlobalAPY(currentTime, genesisTime)
    expect(apy).toBe(expectAPY === 0 ? 0 : expectAPY.toFixed(2))
  })
})
