import mappers from './mappers'
import validatorDecorators from './validators'

export const { MapApiResponse } = mappers
export const { Validate, Password, Required } = validatorDecorators

export default {
  ...mappers,
  ...validatorDecorators,
}
