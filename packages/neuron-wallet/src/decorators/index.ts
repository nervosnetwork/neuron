import errorDecorators from './errors'
import validatorDecorators from './validators'

export const { CatchControllerError } = errorDecorators
export const { Validate, Password, Required } = validatorDecorators

export default {
  ...errorDecorators,
  ...validatorDecorators,
}
