import calculateClaimEpochNumber from 'utils/calculateClaimEpochNumber'
import fixtures from './fixtures.json'

interface EpochInfo {
  number: bigint
  index: bigint
  length: bigint
}

describe('calculate claim epoch number', () => {
  const fixtureTable: [EpochInfo, EpochInfo, number][] = fixtures.epochInfos.map(
    ({ depositEpochInfo, withdrawingEpochInfo, expected }) => [
      {
        number: BigInt(depositEpochInfo.number),
        index: BigInt(depositEpochInfo.index),
        length: BigInt(depositEpochInfo.length),
      },
      {
        number: BigInt(withdrawingEpochInfo.number),
        index: BigInt(withdrawingEpochInfo.index),
        length: BigInt(withdrawingEpochInfo.length),
      },
      expected,
    ]
  )

  test.each(fixtureTable)(`(%s, %s) => %s`, (depositEpochInfo, withdrawingEpochInfo, expected) => {
    const targetEpochNumber = calculateClaimEpochNumber(depositEpochInfo, withdrawingEpochInfo)
    expect(Number(targetEpochNumber)).toBe(expected)
  })
})
