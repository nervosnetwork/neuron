import { t } from 'i18next'

export class SignTransactionFailed extends Error {
  public code = 400

  constructor(msg: string) {
    super(msg.includes('0x6985') ? t('messages.device-sign-canceled') : msg)
  }
}

export class connectDeviceFailed extends Error {
  public code = 401
}

export class UnsupportedManufacturer extends Error {
  public code = 407

  constructor(manufacturer: string) {
    super(t('messages.unsupported-manufacturer', { manufacturer }))
  }
}

export class AskAccessFailed extends Error {
  public code = 408
}
