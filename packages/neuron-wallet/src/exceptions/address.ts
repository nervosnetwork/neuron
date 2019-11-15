import i18n from 'utils/i18n'

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

export default { InvalidAddress, MainnetAddressRequired, TestnetAddressRequired }
