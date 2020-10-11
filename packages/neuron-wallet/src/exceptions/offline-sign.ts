import { t } from 'i18next'

export class OfflineSignFailed extends Error {
  public code = 500

  constructor () {
    super(t('messages.offline-sign-failed'))
  }
}

export class SaveOfflineJSONFailed extends Error {
  public code = 501

  constructor () {
    super(t('messages.save-offline-json-failed'))
  }
}
