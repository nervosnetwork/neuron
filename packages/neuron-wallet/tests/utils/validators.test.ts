import { verifyPasswordComplexity } from '../../src/utils/validators'
import i18n from '../../src/utils/i18n'
import { MIN_PASSWORD_LENGTH } from '../../src/utils/const'

describe('validators', () => {
  it('verify password complexity', () => {
    expect(verifyPasswordComplexity('12ab....'))
    expect(verifyPasswordComplexity('1234ABbaa3'))
    expect(verifyPasswordComplexity('1234AB!@'))
    expect(() => verifyPasswordComplexity('12abAC.')).toThrow(
      i18n.t('messages.wallet-password-less-than-min-length', { minPasswordLength: MIN_PASSWORD_LENGTH }),
    )
    expect(() => verifyPasswordComplexity('1234567a')).toThrow(i18n.t('messages.wallet-password-letter-complexity'))
    expect(() => verifyPasswordComplexity('1234ABAAA')).toThrow(i18n.t('messages.wallet-password-letter-complexity'))
    expect(() => verifyPasswordComplexity('!@~ABAAA')).toThrow(i18n.t('messages.wallet-password-letter-complexity'))
  })
})
