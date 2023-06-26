import { t } from 'i18next'

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

export class TransactionInputParameterMiss extends Error {
  constructor() {
    super(t('messages.transaction-no-input-parameter'))
  }
}

export default {
  TransactionNotFound,
  CapacityTooSmall,
}
