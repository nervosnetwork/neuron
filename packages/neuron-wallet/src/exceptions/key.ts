import i18n from '../utils/i18n'

export class KeyHasNotData extends Error {
  constructor() {
    super(i18n.t('messages.current-key-has-no-data'))
  }
}

export class UnsupportedCipher extends Error {
  constructor() {
    super('messages.unsupported-cipher')
  }
}

export class MnemonicIsInvalid extends Error {
  constructor() {
    super(i18n.t('messages.mnemonic-is-invalid'))
  }
}

export default {
  KeyHasNotData,
  UnsupportedCipher,
  MnemonicIsInvalid,
}
