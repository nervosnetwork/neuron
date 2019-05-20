import WalletsController from '../../src/controllers/wallets'
import i18n from '../../src/utils/i18n'

describe('wallet controllers tests', () => {
  it('verify password complexity', () => {
    expect(WalletsController.verifyPasswordComplexity('12ab....'))
    expect(WalletsController.verifyPasswordComplexity('1234ABbaa3'))
    expect(WalletsController.verifyPasswordComplexity('1234AB!@'))
    expect(() => WalletsController.verifyPasswordComplexity('12abAC.')).toThrow(
      i18n.t('messages.wallet-password-at-least-8-characters'),
    )
    expect(() => WalletsController.verifyPasswordComplexity('1234567a')).toThrow(
      i18n.t('messages.wallet-password-at-least-3-types'),
    )
    expect(() => WalletsController.verifyPasswordComplexity('1234ABAAA')).toThrow(
      i18n.t('messages.wallet-password-at-least-3-types'),
    )
    expect(() => WalletsController.verifyPasswordComplexity('!@~ABAAA')).toThrow(
      i18n.t('messages.wallet-password-at-least-3-types'),
    )
  })
})
