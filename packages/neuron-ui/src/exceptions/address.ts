import { ErrorCode } from 'utils/enums'

const I18N_PATH = `messages.codes.`

export class MainnetAddressRequiredException extends Error {
  public code = ErrorCode.MainnetAddressRequired
  constructor() {
    super(`${I18N_PATH}${ErrorCode.MainnetAddressRequired}`)
  }
}

export class TestnetAddressRequiredException extends Error {
  public code = ErrorCode.TestnetAddressRequired
  constructor() {
    super(`${I18N_PATH}${ErrorCode.TestnetAddressRequired}`)
  }
}

export class AddressEmptyException extends Error {
  public code = ErrorCode.AddressIsEmpty
  constructor() {
    super(`${I18N_PATH}${ErrorCode.AddressIsEmpty}`)
  }
}
