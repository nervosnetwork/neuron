import { t } from 'i18next'

export class MultisigPrefixError extends Error {
  constructor() {
    super(t('messages.multisig-script-prefix-error'))
  }
}

export class MultisigConfigNotExistError extends Error {
  constructor() {
    super(t('messages.multisig-config-not-exist'))
  }
}

export class MultisigConfigExistError extends Error {
  constructor() {
    super(t('messages.multisig-config-exist'))
  }
}

export class ImportMultisigConfigParamsError extends Error {
  constructor() {
    super(t('messages.import-multisig-config-params-error'))
  }
}
