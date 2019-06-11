import i18n from '../utils/i18n'

export class NetworkIsNotFound extends Error {
  constructor(id: string) {
    super(i18n.t('messages.network-is-not-found', { id }))
  }
}

export class DefaultNetworkIsUnremovable extends Error {
  constructor() {
    super(i18n.t('messages.default-network-is-unremovable'))
  }
}

export class LackOfDefaultNetork extends Error {
  constructor() {
    super(i18n.t('messages.lack-of-default-network'))
  }
}

export class ActiveNetowrkIsNotSet extends Error {
  constructor() {
    super(i18n.t('messages.active-network-is-not-set'))
  }
}

export default {
  NetworkIsNotFound,
  DefaultNetworkIsUnremovable,
  LackOfDefaultNetork,
  ActiveNetowrkIsNotSet,
}
