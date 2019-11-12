import i18n from 'utils/i18n'

export class CellIsNotYetLive extends Error {
  constructor() {
    super(i18n.t('messages.cell-is-not-yet-live'))
  }
}

export class TransactionIsNotCommittedYet extends Error {
  constructor() {
    super(i18n.t('messages.transaction-is-not-committed-yet'))
  }
}
