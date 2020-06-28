import { ErrorCode } from 'utils/enums'

const I18N_PATH = `messages.codes.`

export class PasswordIncorrectException extends Error {
  public code = ErrorCode.PasswordIncorrect
  constructor() {
    super(`${I18N_PATH}${ErrorCode.PasswordIncorrect}`)
  }
}

export default { PasswordIncorrectException }
