import { t } from 'locales/i18n'

export class NetworkNotFound extends Error {
  constructor(id: string) {
    super(t('messages.network-not-found', { id }))
  }
}

export class DefaultNetworkUnremovable extends Error {
  constructor() {
    super(t('messages.default-network-unremovable'))
  }
}

export class CurrentNetworkNotSet extends Error {
  constructor() {
    super(t('messages.current-network-not-set'))
  }
}

export default {
  NetworkNotFound,
  DefaultNetworkUnremovable,
  CurrentNetworkNotSet,
}
