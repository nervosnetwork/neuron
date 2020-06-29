import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'
import {
  FieldRequiredException,
  FieldTooLongException,
  FieldTooShortException,
  FieldTooSimpleException,
} from 'exceptions'

export const validatePasswordComplexity = (password: string) => {
  const FIELD_NAME = 'password'

  if (!password) {
    throw new FieldRequiredException(FIELD_NAME)
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new FieldTooShortException(FIELD_NAME, MIN_PASSWORD_LENGTH)
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new FieldTooLongException(FIELD_NAME, MAX_PASSWORD_LENGTH)
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
    throw new FieldTooSimpleException(FIELD_NAME)
  }
  return true
}

export default validatePasswordComplexity
