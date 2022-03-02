import { t } from 'i18next'

export class FailToCreateMnemonic extends Error {
  constructor() {
    super(t('messages.failed-to-create-mnemonic'))
  }
}

export default {
  FailToCreateMnemonic
}
