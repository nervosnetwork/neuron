import i18n from 'locales/i18n'

export class InvalidAddress extends Error {
  constructor(address: string) {
    super(i18n.t('invalid-address', { address }))
  }
}

export class MainnetAddressRequired extends Error {
  constructor(address: string) {
    super(i18n.t('mainnet-address-required', { address }))
  }
}

export class TestnetAddressRequired extends Error {
  constructor(address: string) {
    super(i18n.t('testnet-address-required', { address }))
  }
}

export class AddressNotFound extends Error {
  constructor() {
    super(i18n.t('address-not-found'))
  }
}

export default { InvalidAddress, MainnetAddressRequired, TestnetAddressRequired, AddressNotFound }
