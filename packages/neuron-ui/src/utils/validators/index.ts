// REFACTOR: throw exceptions directly
import { MIN_AMOUNT, SINCE_FIELD_SIZE, MAX_DECIMAL_DIGITS, SHANNON_CKB_RATIO } from 'utils/const'
import { ErrorCode } from 'utils/enums'
import { CKBToShannonFormatter } from 'utils/formatters'
import { ckbCore } from 'services/chain'
import { FieldRequiredException } from 'exceptions'
import { FieldInvalidException, AmountZeroException } from '../../exceptions'

import { sudtAmountToValue } from '../formatters'
//
export * from './address'
export * from './amount'
export * from './totalAmount'
export * from './amountRange'
export * from './sudtAddress'
export * from './sudtAmount'
export * from './passwordComplexity'
export * from './outputs'
export * from './networkName'
export * from './url'
export * from './tokenId'
export * from './tokenName'
export * from './sudtAccountName'
export * from './symbol'
export * from './decimal'
//

const SHORT_ADDR_00_LENGTH = 46
const SHORT_ADDR_00_PREFIX = '0x0100'
const LONG_DATA_PREFIX = '0x02'
const LONG_TYPE_PREFIX = '0x04'

// done
export const verifyAddress = (address: string, isMainnet?: boolean): boolean => {
  if (typeof address !== 'string') {
    return false
  }
  if (isMainnet === true && !address.startsWith('ckb')) {
    return false
  }
  if (isMainnet === false && !address.startsWith('ckt')) {
    return false
  }
  try {
    const parsed = ckbCore.utils.parseAddress(address, 'hex')
    if (parsed.startsWith(LONG_DATA_PREFIX) || parsed.startsWith(LONG_TYPE_PREFIX)) {
      return true
    }
    if (!parsed.startsWith(SHORT_ADDR_00_PREFIX) || address.length !== SHORT_ADDR_00_LENGTH) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

// done
export const verifyAmountRange = (amount: string = '', extraSize: number = 0) => {
  return BigInt(CKBToShannonFormatter(amount)) >= BigInt((MIN_AMOUNT + extraSize) * SHANNON_CKB_RATIO)
}

// done
export const verifyAmount = (amount: string = '0') => {
  if (Number.isNaN(+amount)) {
    return { code: ErrorCode.FieldInvalid }
  }
  const [, decimal = ''] = amount.split('.')
  if (decimal.length > MAX_DECIMAL_DIGITS) {
    return {
      code: ErrorCode.DecimalExceed,
    }
  }
  if (BigInt(CKBToShannonFormatter(amount)) < BigInt(0)) {
    return { code: ErrorCode.NotNegative }
  }
  return true
}

// done
export const verifySUDTAmount = ({
  amount,
  decimal,
  required = false,
}: {
  amount: string
  decimal: string
  required: boolean
}) => {
  const fieldName = 'amount'
  if (!amount && required) {
    throw new FieldRequiredException(fieldName)
  }
  if (amount === '0') {
    throw new AmountZeroException()
  }
  if (Number.isNaN(+amount) || +amount < 0) {
    throw new FieldInvalidException(fieldName)
  }
  try {
    if (sudtAmountToValue(amount, decimal) === undefined) {
      throw new FieldInvalidException(fieldName)
    }
  } catch {
    throw new FieldInvalidException(fieldName)
  }
}

// done
export const verifyTotalAmount = (totalAmount: string, fee: string, balance: string) => {
  if (BigInt(balance) < BigInt(0)) {
    return false
  }
  return BigInt(totalAmount) + BigInt(fee) <= BigInt(balance)
}

// done
export const verifyTransactionOutputs = (items: Readonly<State.Output[]> = [], ignoreLastAmount: boolean = false) => {
  return !items.some((item, i) => {
    const extraSize = item.date ? SINCE_FIELD_SIZE : 0
    if (!item.address || verifyAddress(item.address) !== true) {
      return true
    }
    if (ignoreLastAmount && i === items.length - 1) {
      return false
    }
    if (verifyAmount(item.amount) !== true || verifyAmountRange(item.amount, extraSize) !== true) {
      return true
    }
    return false
  })
}
