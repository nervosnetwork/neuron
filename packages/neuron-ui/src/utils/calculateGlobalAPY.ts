import { getBlockByNumber } from '../services/chain'

const INITIAL_OFFER = BigInt(33600000000)
const SECONDARY_OFFER = BigInt(1344000000)
const DAYS_PER_PERIOD = 365 * 4 * 1
const MILLI_SECONDS_PER_DAY = 24 * 3600 * 1000
const PERIOD_LENGTH = DAYS_PER_PERIOD * MILLI_SECONDS_PER_DAY

let cachedGenesisTimestamp: number | undefined

export default async (now: number, initialTimestamp: number | undefined = cachedGenesisTimestamp) => {
  let genesisTimestamp = initialTimestamp
  if (genesisTimestamp === undefined) {
    genesisTimestamp = await getBlockByNumber('0x0')
      .then(b => {
        cachedGenesisTimestamp = +b.header.timestamp
        return cachedGenesisTimestamp
      })
      .catch(() => undefined)
  }
  if (genesisTimestamp === undefined || now <= genesisTimestamp) {
    return 0
  }

  const pastPeriods = BigInt(now - genesisTimestamp) / BigInt(PERIOD_LENGTH)
  const pastDays = Math.ceil(((now - genesisTimestamp) % PERIOD_LENGTH) / MILLI_SECONDS_PER_DAY)

  const realSecondaryOffer =
    BigInt(4) * SECONDARY_OFFER * pastPeriods +
    (BigInt(4) * SECONDARY_OFFER * BigInt(pastDays)) / BigInt(DAYS_PER_PERIOD)

  let realPrimaryOffer = BigInt(0)

  let PRIMARY_OFFER = INITIAL_OFFER
  for (let i = 0; i < Number(pastPeriods); i++) {
    PRIMARY_OFFER /= BigInt(2)
    const offer = PRIMARY_OFFER
    realPrimaryOffer += offer
  }

  PRIMARY_OFFER /= BigInt(2)

  const primaryOfferFraction = (BigInt(pastDays) * PRIMARY_OFFER) / BigInt(DAYS_PER_PERIOD)
  realPrimaryOffer += primaryOfferFraction

  const totalOffer = INITIAL_OFFER + realPrimaryOffer + realSecondaryOffer
  return +(Number(SECONDARY_OFFER) / Number(totalOffer)).toFixed(2)
}
