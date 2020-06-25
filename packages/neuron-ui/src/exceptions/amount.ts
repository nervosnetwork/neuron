import { ErrorCode } from 'utils/enums'

const I18N_PATH = `messages.codes.`

export class AmountNotEnoughException extends Error {
  public code = ErrorCode.AmountNotEnough
  constructor() {
    super(`${I18N_PATH}${ErrorCode.AmountNotEnough}`)
  }
}

export class AmountZeroException extends Error {
  public code = ErrorCode.AmountZero
  constructor() {
    super(`${I18N_PATH}${ErrorCode.AmountZero}`)
  }
}

export class AmountTooSmallException extends RangeError {
  public code = ErrorCode.AmountTooSmall
  public i18n = {
    amount: '',
    required: '',
  }

  constructor(amount: string, required: string) {
    super(`${I18N_PATH}${ErrorCode.AmountTooSmall}`)
    this.i18n.amount = amount
    this.i18n.required = required
  }
}

export class AmountDecimalExceedException extends RangeError {
  public code = ErrorCode.DecimalExceed
  public i18n = {
    fieldName: 'amount',
    fieldValue: '',
    length: '',
  }

  constructor(value: string, length: number) {
    super(`${I18N_PATH}${ErrorCode.DecimalExceed}`)
    this.i18n.fieldValue = value
    this.i18n.length = `${length}`
  }
}

export class AmountNegativeException extends RangeError {
  public code = ErrorCode.NotNegative
  public i18n = {
    fieldName: 'amount',
    fieldValue: '',
  }

  constructor(value: string) {
    super(`${I18N_PATH}${ErrorCode.NotNegative}`)
    this.i18n.fieldValue = value
  }
}

export class BalanceNotEnoughException extends Error {
  public code = ErrorCode.BalanceNotEnough
  constructor() {
    super(`${I18N_PATH}${ErrorCode.BalanceNotEnough}`)
  }
}
