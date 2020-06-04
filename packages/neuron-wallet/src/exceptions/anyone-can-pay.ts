import i18n from 'locales/i18n'

export class TargetOutputNotFoundError extends Error {
  constructor() {
    super(i18n.t('messages.target-output-not-found'))
  }
}

export class AcpSendSameAccountError extends Error {
  constructor() {
    super(i18n.t('messages.acp-same-account'))
  }
}

export default {
  TargetOutputNotFoundError,
  AcpSendSameAccountError
}
