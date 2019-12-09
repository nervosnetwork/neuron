import validatorDecorators from './validators'

export const { Validate, Password, Required } = validatorDecorators

export default {
  ...validatorDecorators,
}
