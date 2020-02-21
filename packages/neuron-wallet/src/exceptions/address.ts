import i18n from 'locales/i18n'

export class InvalidAddress extends Error {
  constructor(address: string) {
    super(i18n.t('messages.invalid-address', { address }))
  }
}

export class MainnetAddressRequired extends Error {
  constructor(address: string) {
    super(i18n.t('messages.mainnet-address-required', { address }))
  }
}

export class TestnetAddressRequired extends Error {
  constructor(address: string) {
    super(i18n.t('messages.testnet-address-required', { address }))
  }
}

export default { InvalidAddress, MainnetAddressRequired, TestnetAddressRequired }
