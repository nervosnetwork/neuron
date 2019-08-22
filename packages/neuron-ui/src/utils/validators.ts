import { ckbCore } from 'services/chain'
import { ADDRESS_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_AMOUNT } from './const'

export const verifyAddress = (address: string): boolean | string => {
  // TODO: verify address, prd required
  try {
    if (address.length !== ADDRESS_LENGTH) {
      throw new Error('Address length is incorrect')
    }
    ckbCore.utils.parseAddress(address)
    return true
  } catch (err) {
    return err.message
  }
}

export const verifyAmountRange = (amount: string) => {
  return +amount >= MIN_AMOUNT
}

export const verifyPasswordComplexity = (password: string) => {
  if (!password) {
    return 'password-is-empty'
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'password-is-too-short'
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'password-is-too-long'
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
    return 'password-is-too-simple'
  }
  return true
}

export default {
  verifyAddress,
  verifyAmountRange,
  verifyPasswordComplexity,
}
