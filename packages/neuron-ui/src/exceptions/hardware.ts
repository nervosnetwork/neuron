import { ErrorCode } from 'utils/enums'

const I18N_PATH = `messages.codes.`

export class SignTransactionFailedException extends Error {
  public code = ErrorCode.SignTransactionFailed
}

export class ConnectFailedException extends Error {
  public code = ErrorCode.ConnectFailed
}

export class CkbAppNotFoundException extends Error {
  public code = ErrorCode.CkbAppNotFound

  constructor() {
    super(`${I18N_PATH}${ErrorCode.CkbAppNotFound}`)
  }
}

export class DeviceNotFoundException extends Error {
  public code = ErrorCode.DeviceNotFound

  constructor() {
    super(`${I18N_PATH}${ErrorCode.DeviceNotFound}`)
  }
}

export class MultiDeviceException extends Error {
  public code = ErrorCode.MultiDevice

  constructor() {
    super(`${I18N_PATH}${ErrorCode.MultiDevice}`)
  }
}
