import i18n from 'locales/i18n'

export class NetworkNotFound extends Error {
  constructor(id: string) {
    super(i18n.t('messages.network-not-found', { id }))
  }
}

export class DefaultNetworkUnremovable extends Error {
  constructor() {
    super(i18n.t('messages.default-network-unremovable'))
  }
}

export class CurrentNetworkNotSet extends Error {
  constructor() {
    super(i18n.t('messages.current-network-not-set'))
  }
}

export default {
  NetworkNotFound,
  DefaultNetworkUnremovable,
  CurrentNetworkNotSet,
}
