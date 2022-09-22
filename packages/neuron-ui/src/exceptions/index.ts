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
    fieldValue: string
  }

  constructor(fieldName: string, fieldValue: string) {
    super(`${I18N_PATH}${ErrorCode.FieldUsed}`)
    this.i18n = { fieldName, fieldValue }
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

export type ErrorWithI18n = {
  message: string
  code: ErrorCode
  i18n?: Record<string, string>
}

export function isErrorWithI18n(error: any): error is ErrorWithI18n {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error?.message === 'string' &&
    typeof error?.code === 'number' &&
    (!('i18n' in error) || typeof error.i18n === 'object')
  )
}
