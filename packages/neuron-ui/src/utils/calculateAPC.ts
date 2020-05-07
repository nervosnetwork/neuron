const INITIAL_ISSUANCE = 33600000000
const SECONDARY_ISSUANCE_BASE = 1344000000
const ANNUAL_PRIMARY_ISSUANCE_BASE = INITIAL_ISSUANCE / 8
const YEARS_IN_PERIOD = 4

const alphaAtYearNumber = (yearNumber: number) => {
  const i = Math.floor(yearNumber / YEARS_IN_PERIOD)
  const p = ANNUAL_PRIMARY_ISSUANCE_BASE / 2 ** i
  const alpha = p / SECONDARY_ISSUANCE_BASE
  return alpha
}

const capacityAtYearNumber = (yearNumber: number) => {
  let base = INITIAL_ISSUANCE
  const yearIndex = Math.floor(yearNumber / YEARS_IN_PERIOD)
  for (let i = 0; i < yearIndex; i++) {
    base += (ANNUAL_PRIMARY_ISSUANCE_BASE * YEARS_IN_PERIOD) / 2 ** i
  }
  base += (ANNUAL_PRIMARY_ISSUANCE_BASE * (yearNumber - yearIndex * YEARS_IN_PERIOD)) / 2 ** yearIndex
  base += SECONDARY_ISSUANCE_BASE * yearNumber
  return base
}

const apcInPeriod = ({ startYearNumber, endYearNumber }: { startYearNumber: number; endYearNumber: number }) => {
  const capacity = capacityAtYearNumber(startYearNumber)
  const alpha = alphaAtYearNumber(startYearNumber)
  const sn = SECONDARY_ISSUANCE_BASE * (endYearNumber - startYearNumber)
  const rate = Math.log(1 + ((alpha + 1) * sn) / capacity) / (alpha + 1)
  return rate
}

export const calculateAPC = (
  { startYearNumber, endYearNumber }: { startYearNumber: number; endYearNumber: number },
  scale: boolean = true
) => {
  if (endYearNumber < startYearNumber) {
    throw new Error('End year number should not be less than start year number')
  }
  let ratio = endYearNumber - startYearNumber
  let scaledEndYearNumber = endYearNumber
  if (scale && ratio < 1) {
    scaledEndYearNumber = startYearNumber + 1
    ratio = 1
  }
  const checkpointStart = Math.ceil(startYearNumber / YEARS_IN_PERIOD) * YEARS_IN_PERIOD
  const checkpointEnd = Math.floor(scaledEndYearNumber / YEARS_IN_PERIOD) * YEARS_IN_PERIOD
  const checkpoints = Array.from(
    {
      length: (checkpointEnd - checkpointStart) / YEARS_IN_PERIOD + 1,
    },
    (_, k) => k * YEARS_IN_PERIOD + checkpointStart
  )
  if (checkpoints[0] === undefined || checkpoints[0] > startYearNumber) {
    checkpoints.unshift(startYearNumber)
  }
  if (checkpoints[checkpoints.length - 1] < scaledEndYearNumber) {
    checkpoints.push(scaledEndYearNumber)
  }
  const endYearNumbers = checkpoints.slice(1)
  const rates = endYearNumbers.map((yearNumber, idx) => {
    return apcInPeriod({
      startYearNumber: checkpoints[idx],
      endYearNumber: yearNumber,
    })
  })
  const rate = rates.reduce((accumulatedRate, r) => accumulatedRate * (1 + r), 1) - 1
  return +((rate * 100) / ratio).toFixed(2)
}

export default calculateAPC
