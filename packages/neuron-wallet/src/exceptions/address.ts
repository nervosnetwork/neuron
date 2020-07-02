import i18n from 'locales/i18n'

export class InvalidAddress extends Error {
  public code = 102
  public i18n = {
    fieldName: 'address'
  }

  constructor(address: string) {
    super(i18n.t('messages.invalid-address', { address }))
  }
}

export class MainnetAddressRequired extends Error {
  public code = 306
  constructor(address: string) {
    super(i18n.t('messages.mainnet-address-required', { address }))
  }
}

export class TestnetAddressRequired extends Error {
  public code = 307
  constructor(address: string) {
    super(i18n.t('messages.testnet-address-required', { address }))
  }
}

export class AddressNotFound extends Error {
  code = 108
  constructor() {
    super(i18n.t('messages.address-not-found'))
  }
}

export default { InvalidAddress, MainnetAddressRequired, TestnetAddressRequired, AddressNotFound }
