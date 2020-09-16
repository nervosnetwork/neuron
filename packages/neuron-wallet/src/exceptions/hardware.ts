import { t } from 'i18next'

export class SignTransactionFailed extends Error {
  public code = 400
}

export class connectDeviceFailed extends Error {
  public code = 401

  constructor () {
    super(t('messages.connect-device-failed'))
  }
}

export class UnsupportedManufacturer extends Error {
  public code = 407

  constructor (manufacturer: string) {
    super(t('messages.unsupported-manufacturer', { manufacturer }))
  }
}