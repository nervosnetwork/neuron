import { padFractionDigitsIfDecimal } from 'utils/formatters'

describe('padFractionDigitsIfDecimal', () => {
  it('should pad fraction digits if decimal', () => {
    expect(padFractionDigitsIfDecimal(1.2, 5)).toBe('1.20000')
    expect(padFractionDigitsIfDecimal(1.23456789, 3)).toBe('1.23456789')
  })

  it('should not pad fraction digits if not decimal', () => {
    expect(padFractionDigitsIfDecimal(1, 5)).toBe('1')
    expect(padFractionDigitsIfDecimal(123456789, 3)).toBe('123456789')
  })

  it('should handle string input', () => {
    expect(padFractionDigitsIfDecimal('1.2', 5)).toBe('1.20000')
    expect(padFractionDigitsIfDecimal('1.23456789', 3)).toBe('1.23456789')
    expect(padFractionDigitsIfDecimal('1', 2)).toBe('1')
  })

  it('should handle negative numbers', () => {
    expect(padFractionDigitsIfDecimal(-1.2, 5)).toBe('-1.20000')
    expect(padFractionDigitsIfDecimal(-1.23456789, 3)).toBe('-1.23456789')
    expect(padFractionDigitsIfDecimal(-1, 2)).toBe('-1')
  })

  it('should handle zero padding', () => {
    expect(padFractionDigitsIfDecimal(1.2, 0)).toBe('1.2')
    expect(padFractionDigitsIfDecimal(1.23456789, 0)).toBe('1.23456789')
    expect(padFractionDigitsIfDecimal(1, 0)).toBe('1')
  })

  it('should handle non-numeric input', () => {
    expect(padFractionDigitsIfDecimal('hello', 5)).toBe('hello')
  })
})
