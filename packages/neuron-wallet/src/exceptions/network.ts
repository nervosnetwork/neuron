import i18n from 'utils/i18n'

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

export class LackOfDefaultNetwork extends Error {
  constructor() {
    super(i18n.t('messages.lack-of-default-network'))
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
  LackOfDefaultNetwork,
  CurrentNetworkNotSet,
}
