import i18n from 'utils/i18n'

export class InvalidName extends Error {
  constructor(field: string) {
    super(i18n.t('messages.invalid-name', { field }))
  }
}

export class UsedName extends Error {
  constructor(field: string) {
    super(i18n.t('messages.used-name', { field }))
  }
}
export class IsRequired extends Error {
  constructor(field: string) {
    super(i18n.t('messages.is-required', { field }))
  }
}

export class MissingRequiredArgument extends Error {
  constructor() {
    super(i18n.t('messages.missing-required-argument'))
  }
}

export class ServiceHasNoResponse extends Error {
  constructor(serviceName: string) {
    super(`${serviceName} service has no response`)
  }
}
export class InvalidFormat extends Error {
  constructor(field: string) {
    super(i18n.t('messages.invalid-format', { field }))
  }
}

export class ShouldBeTypeOf extends Error {
  constructor(field: string, type: string) {
    super(i18n.t('should-be-type-of', { field, type }))
  }
}

export class InvalidJSON extends Error {
  constructor() {
    super(i18n.t('messages.invalid-JSON'))
  }
}

export default {
  InvalidName,
  UsedName,
  IsRequired,
  MissingRequiredArgument,
  ServiceHasNoResponse,
  ShouldBeTypeOf,
  InvalidJSON,
}
