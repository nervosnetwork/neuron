import 'reflect-metadata'

import i18n from 'locales/i18n'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from 'utils/const'
import { MissingRequiredArgument } from 'exceptions'

const requiredMetadataKey = Symbol('required')
const passwordMetadataKey = Symbol('password')

export const verifyPasswordComplexity = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw Error(i18n.t('messages.wallet-password-less-than-min-length', { minPasswordLength: MIN_PASSWORD_LENGTH }))
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw Error(i18n.t('messages.wallet-password-more-than-max-length', { maxPasswordLength: MAX_PASSWORD_LENGTH }))
  }
  let complex = 0
  let reg = /\d/
  if (reg.test(password)) {
    complex++
  }
  reg = /[a-z]/
  if (reg.test(password)) {
    complex++
  }
  reg = /[A-Z]/
  if (reg.test(password)) {
    complex++
  }
  reg = /[^0-9a-zA-Z]/
  if (reg.test(password)) {
    complex++
  }
  if (complex < 3) {
    throw Error(i18n.t('messages.wallet-password-letter-complexity'))
  }
}

const Required = (target: Object, propertyKey: string | symbol, index: number) => {
  const indices: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || []
  indices.push(index)
  Reflect.defineMetadata(requiredMetadataKey, indices, target, propertyKey)
}

const Password = (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
  Reflect.defineMetadata(passwordMetadataKey, parameterIndex, target, propertyKey)
}

const Validate = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value
  return {
    ...descriptor,
    async value(...args: any[]) {
      const requiredIndices: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey)
      if (requiredIndices) {
        requiredIndices.forEach(idx => {
          if (idx >= args.length || args[idx] === undefined) {
            throw new MissingRequiredArgument()
          }
        })
      }

      const passwordIndex: number = Reflect.getOwnMetadata(passwordMetadataKey, target, propertyKey)
      if (passwordIndex !== undefined) {
        verifyPasswordComplexity(args[passwordIndex])
      }
      return originalMethod.apply(this, args)
    },
  }
}

export default {
  Required,
  Password,
  Validate,
}
