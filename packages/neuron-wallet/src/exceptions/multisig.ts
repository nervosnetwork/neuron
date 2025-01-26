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

export class MultisigConfigAddressError extends Error {
  constructor() {
    super(t('messages.multisig-config-address-error'))
  }
}

export class MultisigConfigNeedError extends Error {
  public code = 502
  constructor() {
    super(t('messages.multisig-config-need-error'))
  }
}

export class MultisigNotSignedNeedError extends Error {
  constructor() {
    super(t('messages.multisig-not-signed'))
  }
}
