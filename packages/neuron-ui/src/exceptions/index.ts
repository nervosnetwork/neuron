import { ErrorCode } from 'utils/const'
import { MIN_DECIMAL, MAX_DECIMAL } from '../utils/const'

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

export class DecimalRangeError extends RangeError {
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

export default undefined
