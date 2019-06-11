import i18n from '../utils/i18n'

export class TransactionIsNotFound extends Error {
  constructor(hash: string) {
    super(i18n.t('messages.transaction-is-not-found', { hash }))
  }
}

export default {
  TransactionIsNotFound,
}
