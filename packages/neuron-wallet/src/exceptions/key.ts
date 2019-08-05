import i18n from 'utils/i18n'

export class KeyHasNoData extends Error {
  constructor() {
    super(i18n.t('messages.current-key-has-no-data'))
  }
}

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
  KeyHasNoData,
  UnsupportedCipher,
  InvalidMnemonic,
}
