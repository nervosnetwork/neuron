import { t } from 'i18next'

export class InvalidAddress extends Error {
  public code = 102
  public i18n = {
    fieldName: 'address',
  }

  constructor(address: string) {
    super(t('messages.invalid-address', { address }))
  }
}

export class MainnetAddressRequired extends Error {
  public code = 306
  constructor(address: string) {
    super(t('messages.mainnet-address-required', { address }))
  }
}

export class TestnetAddressRequired extends Error {
  public code = 307
  constructor(address: string) {
    super(t('messages.testnet-address-required', { address }))
  }
}

export class AddressNotFound extends Error {
  code = 108
  constructor() {
    super(t('messages.address-not-found'))
  }
}

export class NoMatchAddressForSign extends Error {
  code = 109
  constructor() {
    super(t('messages.no-match-address-for-sign'))
  }
}

export class AddressRequired extends Error {
  public code = 311
  constructor() {
    super(t('messages.address-required'))
  }
}

export default {
  InvalidAddress,
  MainnetAddressRequired,
  TestnetAddressRequired,
  AddressNotFound,
  NoMatchAddressForSign,
  AddressRequired,
}
