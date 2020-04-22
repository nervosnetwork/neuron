// REFACTOR: throw exceptions directly
import {
  MAX_NETWORK_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_AMOUNT,
  SINCE_FIELD_SIZE,
  MAX_DECIMAL_DIGITS,
  SHANNON_CKB_RATIO,
  ErrorCode,
  DEFAULT_SUDT_FIELDS,
  TOKEN_ID_LENGTH,
} from 'utils/const'
import { CKBToShannonFormatter } from 'utils/formatters'
import { ckbCore } from 'services/chain'
import { FieldRequiredException } from 'exceptions'
import {
  MIN_DECIMAL,
  MAX_DECIMAL,
  MAX_SUDT_TOKEN_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_SUDT_ACCOUNT_NAME_LENGTH,
} from './const'
import {
  DecimalRangeError,
  FieldInvalidException,
  FieldUsedException,
  FieldTooLongException,
} from '../exceptions/index'

import { sudtAmountToValue } from './formatters'

const SHORT_ADDR_00_LENGTH = 46
const SHORT_ADDR_00_PREFIX = '0x0100'
const LONG_DATA_PREFIX = '0x02'
const LONG_TYPE_PREFIX = '0x04'

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

export const verifySUDTAddress = (address: string, codeHash: string, isMainnet?: boolean): boolean => {
  // TODO: add sudt address rules
  if (!verifyAddress(address, isMainnet)) {
    return false
  }
  try {
    // verify anyone can pay for now
    const parsed = ckbCore.utils.parseAddress(address, 'hex')
    if (!parsed.startsWith(LONG_TYPE_PREFIX)) {
      return false
    }
    const CODE_HASH_LENGTH = 64
    const codeHashOfAddr = parsed.slice(4, 4 + CODE_HASH_LENGTH)
    if (codeHash && codeHashOfAddr !== codeHash.slice(2)) {
      return false
    }
    const ARGS_LENGTH = 40
    const minimums = parsed.slice(4 + CODE_HASH_LENGTH + ARGS_LENGTH)
    if (minimums && ((minimums.length !== 2 && minimums.length !== 4) || Number.isNaN(+`0x${minimums}`))) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export const verifyAmountRange = (amount: string = '', extraSize: number = 0) => {
  return BigInt(CKBToShannonFormatter(amount)) >= BigInt((MIN_AMOUNT + extraSize) * SHANNON_CKB_RATIO)
}

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

export const verifySUDTAmount = (amount: string, decimal: string) => {
  // TODO: add sUDT rules
  if (Number.isNaN(+amount) || +amount < 0) {
    return false
  }
  try {
    return sudtAmountToValue(amount, decimal) !== undefined
  } catch {
    return false
  }
}

export const verifyTotalAmount = (totalAmount: string, fee: string, balance: string) => {
  if (BigInt(balance) < BigInt(0)) {
    return false
  }
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

export const verifyNetworkName = (name: string, usedNames: string[]) => {
  if (!name) {
    return {
      code: ErrorCode.FieldRequired,
    }
  }
  if (usedNames.includes(name)) {
    return {
      code: ErrorCode.FieldUsed,
    }
  }
  if (name.length > MAX_NETWORK_NAME_LENGTH) {
    return {
      code: ErrorCode.FieldTooLong,
    }
  }
  return true
}

export const verifyURL = (url: string) => {
  if (!url) {
    return {
      code: ErrorCode.FieldRequired,
    }
  }
  if (!/^https?:\/\//.test(url)) {
    return {
      code: ErrorCode.ProtocolRequired,
    }
  }
  if (/\s/.test(url)) {
    return {
      code: ErrorCode.NoWhiteSpaces,
    }
  }
  return true
}

export const verifyTokenId = ({
  tokenId,
  isCKB = false,
  required = false,
}: {
  tokenId: string
  isCKB: boolean
  required: boolean
}) => {
  if (!tokenId && required) {
    throw new FieldRequiredException('token-id')
  }

  if (isCKB && tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId) {
    return true
  }

  if (tokenId.startsWith('0x') && tokenId.length === TOKEN_ID_LENGTH && !Number.isNaN(+tokenId)) {
    return true
  }

  if (tokenId) {
    throw new FieldInvalidException('token-id')
  }
  return true
}

export const verifyTokenName = ({ tokenName, required = false }: { tokenName: string; required?: boolean }) => {
  const fieldName = 'token-name'
  if (!tokenName && required) {
    throw new FieldRequiredException(fieldName)
  }
  if (tokenName.length > MAX_SUDT_TOKEN_NAME_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SUDT_TOKEN_NAME_LENGTH)
  }
}

export const verifySUDTAccountName = ({
  name = '',
  exists = [],
  required = false,
}: {
  name: string
  exists?: string[]
  required?: boolean
}) => {
  const fieldName = 'account-name'
  if (!name && required) {
    throw new FieldRequiredException(fieldName)
  }
  if (name.length > MAX_SUDT_ACCOUNT_NAME_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SUDT_ACCOUNT_NAME_LENGTH)
  }
  if (exists.includes(name)) {
    throw new FieldUsedException(fieldName)
  }
}

export const verifySymbol = ({ symbol, required = false }: { symbol: string; required?: boolean }) => {
  const fieldName = 'symbol'
  if (!symbol && required) {
    throw new FieldRequiredException(fieldName)
  }
  if (symbol.length > MAX_SYMBOL_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SYMBOL_LENGTH)
  }
  if ([...symbol].some(char => char.charCodeAt(0) > 127)) {
    throw new FieldInvalidException(fieldName)
  }
}

export const verifyDecimal = ({ decimal, required = false }: { decimal: string; required: boolean }) => {
  const fieldName = 'decimal'
  if (!decimal && required) {
    throw new FieldRequiredException(fieldName)
  }
  if (Number.isNaN(+decimal) || !Number.isInteger(+decimal)) {
    throw new FieldInvalidException(fieldName)
  }
  if (+decimal < MIN_DECIMAL || +decimal > MAX_DECIMAL) {
    throw new DecimalRangeError()
  }
}

export default {
  verifyAddress,
  verifySUDTAddress,
  verifyAmountRange,
  verifySUDTAmount,
  verifyTotalAmount,
  verifyPasswordComplexity,
  verifyTransactionOutputs,
  verifyNetworkName,
  verifyTokenId,
  verifySUDTAccountName,
  verifySymbol,
  verifyDecimal,
}
