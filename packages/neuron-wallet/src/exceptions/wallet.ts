import i18n from 'locales/i18n'

export class CurrentWalletNotSet extends Error {
  constructor() {
    super(i18n.t('messages.current-wallet-not-set'))
  }
}
export class WalletNotFound extends Error {
  constructor(id: string) {
    super(i18n.t('messages.wallet-not-found', { id }))
  }
}

export class IncorrectPassword extends Error {
  public code = 103
  constructor() {
    super(i18n.t('messages.incorrect-password'))
  }
}

export class EmptyPassword extends Error {
  constructor() {
    super(i18n.t('messages.is-required', { field: i18n.t('keywords.password') }))
  }
}

export class CodeHashNotLoaded extends Error {
  constructor() {
    super(i18n.t('messages.codehash-not-loaded'))
  }
}

export class CapacityNotEnough extends Error {
  constructor() {
    super(i18n.t('messages.capacity-not-enough'))
  }
}

export class LiveCapacityNotEnough extends Error {
  constructor() {
    super(i18n.t('messages.live-capacity-not-enough'))
  }
}

export class CapacityNotEnoughForChange extends Error {
  public code = 105
  constructor() {
    super(i18n.t('messages.capacity-not-enough-for-change'))
  }
}

export class InvalidKeystore extends Error {
  constructor() {
    super(i18n.t('messages.invalid-keystore'))
  }
}

export default {
  WalletNotFound,
  CurrentWalletNotSet,
  IncorrectPassword,
  EmptyPassword,
  CodeHashNotLoaded,
  CapacityNotEnough,
  LiveCapacityNotEnough,
  CapacityNotEnoughForChange,
  InvalidKeystore,
}
