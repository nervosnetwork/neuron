import { ErrorCode } from 'utils/enums'
import { MIN_DECIMAL, MAX_DECIMAL } from 'utils/const'

export class FieldInvalidException extends Error {
  public code = ErrorCode.FieldInvalid
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`messages.codes.${ErrorCode.FieldInvalid}`)
    this.i18n = {
      fieldName,
    }
  }
}

export class FieldRequiredException extends Error {
  public code = ErrorCode.FieldRequired
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`messages.codes.${ErrorCode.FieldRequired}`)
    this.i18n = { fieldName }
  }
}

export class FieldTooLongException extends Error {
  public code = ErrorCode.FieldTooLong
  public i18n: {
    fieldName: string
    length: number
  }

  constructor(fieldName: string, length: number) {
    super(`messages.codes.${ErrorCode.FieldTooLong}`)
    this.i18n = {
      fieldName,
      length,
    }
  }
}

export class FieldUsedException extends Error {
  public code = ErrorCode.FieldUsed
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`messages.codes.${ErrorCode.FieldUsed}`)
    this.i18n = {
      fieldName,
    }
  }
}

export class DecimalRangeException extends RangeError {
  public code = ErrorCode.FieldInvalid
  public i18n = {
    range: `${MIN_DECIMAL}-${MAX_DECIMAL}`,
  }

  constructor() {
    super(`messages.decimal-range`)
  }
}

export class AmountNotEnoughException extends Error {
  public code = ErrorCode.AmountNotEnough
  constructor() {
    super(`messages.codes.${ErrorCode.AmountNotEnough}`)
  }
}

export class AmountZeroException extends Error {
  public code = ErrorCode.AmountZero
  constructor() {
    super(`messages.codes.${ErrorCode.AmountZero}`)
  }
}

export class ValueReservedException extends Error {
  public code = ErrorCode.ValueReserved
  public i18n = {
    value: '',
  }

  constructor(value: string) {
    super(`messages.codes.${ErrorCode.ValueReserved}`)
    this.i18n.value = value
  }
}

export class PasswordIncorrectException extends Error {
  public code = ErrorCode.PasswordIncorrect
  constructor() {
    super(`messages.codes.${ErrorCode.PasswordIncorrect}`)
  }
}
