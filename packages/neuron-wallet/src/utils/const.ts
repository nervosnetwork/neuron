export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50

export enum Channel {
  Initiate = 'initiate',
  App = 'app',
  Networks = 'networks',
  Wallets = 'wallets',
  Transactions = 'transactions',
  Helpers = 'helpers',
}

export enum ResponseCode {
  Fail,
  Success,
}

export default {
  Channel,
  ResponseCode,
}
