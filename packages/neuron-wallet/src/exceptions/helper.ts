import i18n from 'utils/i18n'

export class FailToCreateMnemonic extends Error {
  constructor() {
    super(i18n.t('messages.failed-to-create-mnemonic'))
  }
}

export default {
  FailToCreateMnemonic,
}
