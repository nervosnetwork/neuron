import WalletsController from '../../src/controllers/wallets'

describe('wallet controllers tests', () => {
  it('verify password complexity', () => {
    expect(WalletsController.verifyPasswordComplexity('12abAC.')).toBe(false)
    expect(WalletsController.verifyPasswordComplexity('12ab....')).toBe(true)
    expect(WalletsController.verifyPasswordComplexity('1234567a')).toBe(false)
    expect(WalletsController.verifyPasswordComplexity('1234ABbaa3')).toBe(true)
    expect(WalletsController.verifyPasswordComplexity('1234AB!@')).toBe(true)
    expect(WalletsController.verifyPasswordComplexity('1234ABAAA')).toBe(false)
    expect(WalletsController.verifyPasswordComplexity('!@~ABAAA')).toBe(false)
  })
})
