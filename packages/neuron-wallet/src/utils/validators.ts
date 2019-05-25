import i18n from './i18n'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './const'

export const verifyPasswordComplexity = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw Error(i18n.t('messages.wallet-password-less-than-min-length', { minPasswordLength: MIN_PASSWORD_LENGTH }))
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw Error(i18n.t('messages.wallet-password-more-than-max-length', { maxPasswordLength: MAX_PASSWORD_LENGTH }))
  }
  let complex = 0
  let reg = /\d/
  if (reg.test(password)) {
    complex++
  }
  reg = /[a-z]/
  if (reg.test(password)) {
    complex++
  }
  reg = /[A-Z]/
  if (reg.test(password)) {
    complex++
  }
  reg = /[^0-9a-zA-Z]/
  if (reg.test(password)) {
    complex++
  }
  if (complex < 3) {
    throw Error(i18n.t('messages.wallet-password-letter-complexity'))
  }
}

export default {
  verifyPasswordComplexity,
}
