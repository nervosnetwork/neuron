import WalletsController from '../../src/controllers/wallets'
import i18n from '../../src/utils/i18n'
import { MIN_PASSWORD_LENGTH } from '../../src/utils/const'

describe('wallet controllers tests', () => {
  it('verify password complexity', () => {
    expect(WalletsController.verifyPasswordComplexity('12ab....'))
    expect(WalletsController.verifyPasswordComplexity('1234ABbaa3'))
    expect(WalletsController.verifyPasswordComplexity('1234AB!@'))
    expect(() => WalletsController.verifyPasswordComplexity('12abAC.')).toThrow(
      i18n.t('messages.wallet-password-less-than-min-length', { minPasswordLength: MIN_PASSWORD_LENGTH }),
    )
    expect(() => WalletsController.verifyPasswordComplexity('1234567a')).toThrow(
      i18n.t('messages.wallet-password-letter-complexity'),
    )
    expect(() => WalletsController.verifyPasswordComplexity('1234ABAAA')).toThrow(
      i18n.t('messages.wallet-password-letter-complexity'),
    )
    expect(() => WalletsController.verifyPasswordComplexity('!@~ABAAA')).toThrow(
      i18n.t('messages.wallet-password-letter-complexity'),
    )
  })
})
