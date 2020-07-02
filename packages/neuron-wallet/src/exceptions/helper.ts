import { t } from 'locales/i18n'

export class FailToCreateMnemonic extends Error {
  constructor() {
    super(t('messages.failed-to-create-mnemonic'))
  }
}

export default {
  FailToCreateMnemonic,
}
