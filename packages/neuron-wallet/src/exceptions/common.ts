import { t } from 'i18next'

export class InvalidName extends Error {
  constructor(field: string) {
    super(t('messages.invalid-name', { field }))
  }
}

export class UsedName extends Error {
  constructor(field: string) {
    super(t('messages.used-name', { field }))
  }
}
export class IsRequired extends Error {
  constructor(field: string) {
    super(t('messages.is-required', { field }))
  }
}

export class MissingRequiredArgument extends Error {
  constructor() {
    super(t('messages.missing-required-argument'))
  }
}

export class ServiceHasNoResponse extends Error {
  constructor(serviceName: string) {
    super(`${serviceName} service has no response`)
  }
}
export class InvalidFormat extends Error {
  constructor(field: string) {
    super(t('messages.invalid-format', { field }))
  }
}

export class ShouldBeTypeOf extends Error {
  constructor(field: string, type: string) {
    super(t('should-be-type-of', { field, type }))
  }
}

export class InvalidJSON extends Error {
  constructor() {
    super(t('messages.invalid-json'))
  }
}
export class ShouldInChildProcess extends Error {
  constructor() {
    super(`This function should be run in a child process`)
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
  ShouldInChildProcess
}
