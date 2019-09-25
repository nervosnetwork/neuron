export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 50

export enum ResponseCode {
  Fail,
  Success,
}

export enum ExternalURL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Issues = 'https://github.com/nervosnetwork/neuron/issues',
}

export default {
  ResponseCode,
}
