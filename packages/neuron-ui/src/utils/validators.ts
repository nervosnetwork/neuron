/* global BigInt */
import { ckbCore } from 'services/chain'
import { outputsToTotalCapacity } from 'utils/formatters'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MIN_AMOUNT, MAX_DECIMAL_DIGITS, ErrorCode } from './const'

export const verifyAddress = (address: string): boolean => {
  try {
    ckbCore.utils.parseAddress(address)
    return true
  } catch (err) {
    return false
  }
}

export const verifyAmountRange = (amount: string = '') => {
  return +amount >= MIN_AMOUNT
}

export const verifyAmount = (amount: string = '0') => {
  if (Number.isNaN(+amount) || +amount < 0) {
    return { code: ErrorCode.NotNegative, meta: { fieldName: 'amount', fieldValue: amount } }
  }
  const [, decimal = ''] = amount.split('.')
  if (decimal.length > MAX_DECIMAL_DIGITS) {
    return {
      code: ErrorCode.DecimalExceed,
      meta: { fieldName: 'amount', fieldValue: amount },
    }
  }
  return true
}

export const verifyTotalAmount = (items: any, fee: string, balance: string) => {
  const totalAmount = outputsToTotalCapacity(items)
  return BigInt(totalAmount) + BigInt(fee) <= BigInt(balance)
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
  verifyTotalAmount,
  verifyPasswordComplexity,
}
