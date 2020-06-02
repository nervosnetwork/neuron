
const DECIMAL = 8

const shannonToCKB = (shannon: bigint) => {
  if (shannon === BigInt(0)) {
    return `0.${'0'.repeat(DECIMAL)}`
  }

  const isNegative = shannon < 0
  const absStr = isNegative ? `${shannon}`.slice(1) : `${shannon}`
  if (absStr.length <= DECIMAL) {
    return `${isNegative ? '-' : '+'}0.${absStr.padStart(DECIMAL, '0')}`
  }
  const int = absStr.slice(0, -1 * DECIMAL)
  const dec = absStr.slice(-1 * DECIMAL)
  return `${isNegative ? '-' : '+'}${int}.${dec}`
}

export default shannonToCKB
