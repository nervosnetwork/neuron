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

  static message = `${I18N_PATH}${ErrorCode.CkbAppNotFound}`

  constructor() {
    super(CkbAppNotFoundException.message)
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

export class DeviceNotMatchWalletException extends Error {
  public code = ErrorCode.DeviceNotMatchWallet

  static message = `${I18N_PATH}${ErrorCode.DeviceNotMatchWallet}`

  constructor() {
    super(DeviceNotMatchWalletException.message)
  }
}
