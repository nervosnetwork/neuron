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
  constructor() {
    super(`${I18N_PATH}${ErrorCode.AmountTooSmall}`)
  }
}

export class AmountDecimalExceedException extends RangeError {
  public code = ErrorCode.DecimalExceed
  public i18n = {
    fieldName: 'amount',
  }

  constructor() {
    super(`${I18N_PATH}${ErrorCode.DecimalExceed}`)
  }
}

export class AmountNegativeException extends RangeError {
  public code = ErrorCode.NotNegative
  public i18n = {
    fieldName: 'amount',
  }

  constructor() {
    super(`${I18N_PATH}${ErrorCode.NotNegative}`)
  }
}

export class BalanceNotEnoughException extends Error {
  public code = ErrorCode.BalanceNotEnough
  constructor() {
    super(`${I18N_PATH}${ErrorCode.BalanceNotEnough}`)
  }
}
