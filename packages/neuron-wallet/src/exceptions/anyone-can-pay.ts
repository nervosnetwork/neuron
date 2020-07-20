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

export default {
  TargetOutputNotFoundError,
  AcpSendSameAccountError
}
