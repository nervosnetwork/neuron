import { t } from 'i18next'

export class MultiSignPrefixError extends Error {
  constructor() {
    super(t('messages.multi-sign-script-prefix-error'))
  }
}

export class MultiSignConfigNotExistError extends Error {
  constructor() {
    super(t('messages.multi-sign-config-not-exist'))
  }
}

export class MultiSignConfigExistError extends Error {
  constructor() {
    super(t('messages.multi-sign-config-exist'))
  }
}

export class ImportMultiSignConfigParamsError extends Error {
  constructor() {
    super(t('messages.import-multi-sign-config-params-error'))
  }
}
