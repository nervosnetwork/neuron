const YEAR = 365 * 24 * 60 * 60 * 1000

export default (allowance: string, amount: string, duration: string) => {
  const BASE = 10000
  const v = +((BigInt(allowance) * BigInt(BASE)) / BigInt(amount)).toString() * (YEAR / +duration)
  return `${(v / BASE).toFixed(2)}`
}
