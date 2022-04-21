import { t } from 'i18next'

export class TargetOutputNotFoundError extends Error {
  constructor() {
    super(t('messages.target-output-not-found'))
  }
}

export class AcpSendSameAccountError extends Error {
  constructor() {
    super(t('messages.acp-same-account'))
  }
}

export class MigrateSudtCellNoTypeError extends Error {
  constructor() {
    super(t('messages.migrate-sudt-no-type'))
  }
}

export class SudtAcpHaveDataError extends Error {
  constructor() {
    super(t('messages.sudt-acp-have-data'))
  }
}

export default {
  TargetOutputNotFoundError,
  AcpSendSameAccountError
}
