import { t } from 'i18next'

export class UnsupportedCipher extends Error {
  constructor() {
    super('messages.unsupported-cipher')
  }
}

export class InvalidMnemonic extends Error {
  constructor() {
    super(t('messages.invalid-mnemonic'))
  }
}

export default {
  UnsupportedCipher,
  InvalidMnemonic,
}
