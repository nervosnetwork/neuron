import { ErrorCode } from 'utils/enums'
import { MIN_DECIMAL, MAX_DECIMAL } from 'utils/const'

export * from './address'
export * from './amount'
export * from './url'
export * from './password'
export * from './hardware'

const I18N_PATH = `messages.codes.`

export class FieldInvalidException extends Error {
  public code = ErrorCode.FieldInvalid
  public i18n: {
    fieldName: string
    fieldValue: string
  }

  constructor(fieldName: string, fieldValue = '') {
    super(`${I18N_PATH}${ErrorCode.FieldInvalid}`)
    this.i18n = {
      fieldName,
      fieldValue,
    }
  }
}

export class FieldRequiredException extends Error {
  public code = ErrorCode.FieldRequired
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`${I18N_PATH}${ErrorCode.FieldRequired}`)
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
    super(`${I18N_PATH}${ErrorCode.FieldTooLong}`)
    this.i18n = { fieldName, length }
  }
}

export class FieldTooShortException extends Error {
  public code = ErrorCode.FieldTooShort
  public i18n: {
    fieldName: string
    length: number
  }

  constructor(fieldName: string, length: number) {
    super(`${I18N_PATH}${ErrorCode.FieldTooShort}`)
    this.i18n = { fieldName, length }
  }
}

export class FieldTooSimpleException extends Error {
  public code = ErrorCode.FieldTooSimple
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`${I18N_PATH}${ErrorCode.FieldTooSimple}`)
    this.i18n = { fieldName }
  }
}

export class FieldUsedException extends Error {
  public code = ErrorCode.FieldUsed
  public i18n: {
    fieldName: string
  }

  constructor(fieldName: string) {
    super(`${I18N_PATH}${ErrorCode.FieldUsed}`)
    this.i18n = { fieldName }
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

export class ValueReservedException extends Error {
  public code = ErrorCode.ValueReserved
  public i18n: {
    value: string
  }

  constructor(value: string) {
    super(`${I18N_PATH}${ErrorCode.ValueReserved}`)
    this.i18n = { value }
  }
}
