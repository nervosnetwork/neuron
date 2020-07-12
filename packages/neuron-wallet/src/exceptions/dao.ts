import { t } from 'i18next'

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
