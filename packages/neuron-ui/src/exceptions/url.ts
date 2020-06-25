import { ErrorCode } from 'utils/enums'

const I18N_PATH = `messages.codes.`

export class URLProtocolRequiredException extends Error {
  public code = ErrorCode.ProtocolRequired
  public i18n = {
    fieldName: 'remote',
    fieldValue: '',
  }

  constructor(url: string) {
    super(`${I18N_PATH}${ErrorCode.ProtocolRequired}`)
    this.i18n.fieldValue = url
  }
}

export class URLNoWhiteSpacesException extends Error {
  public code = ErrorCode.NoWhiteSpaces
  public i18n = {
    fieldName: 'remote',
  }

  constructor() {
    super(`${I18N_PATH}${ErrorCode.NoWhiteSpaces}`)
  }
}
