import { t } from 'locales/i18n'

export class TransactionNotFound extends Error {
  constructor(hash: string) {
    super(t('messages.transaction-not-found', { hash }))
  }
}

export class CapacityTooSmall extends Error {
  public code = 114
  public i18n: {
    bytes: string
  }

  constructor(bytes: string = '61') {
    super(t('messages.capacity-too-small', { bytes }))
    this.i18n = { bytes }
  }
}

export default {
  TransactionNotFound,
  CapacityTooSmall,
}
