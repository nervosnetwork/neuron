import i18n from '../utils/i18n'

export class CurrentWalletIsNotSet extends Error {
  constructor() {
    super(i18n.t('messages.current-wallet-is-not-set'))
  }
}
export class WalletIsNotFound extends Error {
  constructor(id: string) {
    super(i18n.t('messages.wallet-is-not-found', { id }))
  }
}

export class PasswordIsIncorrect extends Error {
  constructor() {
    super(i18n.t('messages.password-is-incorrect'))
  }
}

export class CodeHashIsNotLoaded extends Error {
  constructor() {
    super(i18n.t('messages.codehash-is-not-loaded'))
  }
}

export class CapacityIsNotEnough extends Error {
  constructor() {
    super(i18n.t('messages.capacity-is-not-enough'))
  }
}

export default {
  WalletIsNotFound,
  CurrentWalletIsNotSet,
  PasswordIsIncorrect,
  CodeHashIsNotLoaded,
  CapacityIsNotEnough,
}
