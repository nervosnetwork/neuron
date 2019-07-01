import errorDecorators from './errors'
import validatorDecorators from './validators'
import controllerDecorator from './controller'

export const { CatchControllerError } = errorDecorators
export const { Validate, Password, Required } = validatorDecorators
export const { Controller } = controllerDecorator

export default {
  ...errorDecorators,
  ...validatorDecorators,
  ...controllerDecorator,
}
