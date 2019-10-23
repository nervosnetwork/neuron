import i18n from 'utils/i18n'

export class UnsupportedCipher extends Error {
  constructor() {
    super('messages.unsupported-cipher')
  }
}

export class InvalidMnemonic extends Error {
  constructor() {
    super(i18n.t('messages.invalid-mnemonic'))
  }
}

export default {
  UnsupportedCipher,
  InvalidMnemonic,
}
