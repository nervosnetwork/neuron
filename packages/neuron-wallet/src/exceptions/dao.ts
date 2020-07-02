import { t } from 'locales/i18n'

export class CellIsNotYetLive extends Error {
  constructor() {
    super(t('messages.cell-is-not-yet-live'))
  }
}

export class TransactionIsNotCommittedYet extends Error {
  constructor() {
    super(t('messages.transaction-is-not-committed-yet'))
  }
}
