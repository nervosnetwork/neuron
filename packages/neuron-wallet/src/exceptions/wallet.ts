import i18n from '../utils/i18n'

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
  constructor() {
    super(i18n.t('messages.incorrect-password'))
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

export default {
  WalletNotFound,
  CurrentWalletNotSet,
  IncorrectPassword,
  CodeHashNotLoaded,
  CapacityNotEnough,
}
