import i18n from '../utils/i18n'

export class TransactionNotFound extends Error {
  constructor(hash: string) {
    super(i18n.t('messages.transaction-not-found', { hash }))
  }
}

export class CapacityTooSmall extends Error {
  constructor() {
    super(i18n.t('messages.capacity-too-small'))
  }
}

export default {
  TransactionNotFound,
  CapacityTooSmall,
}
