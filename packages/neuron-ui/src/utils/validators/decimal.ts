import { MIN_DECIMAL, MAX_DECIMAL } from 'utils/const'
import { FieldRequiredException, DecimalRangeException, FieldInvalidException } from 'exceptions'

export const validateDecimal = ({ decimal, required = false }: { decimal: string; required?: boolean }) => {
  const fieldName = 'decimal'

  if (!decimal && required) {
    throw new FieldRequiredException(fieldName)
  }

  if (Number.isNaN(+decimal) || !Number.isInteger(+decimal)) {
    throw new FieldInvalidException(fieldName)
  }

  if (+decimal < MIN_DECIMAL || +decimal > MAX_DECIMAL) {
    throw new DecimalRangeException()
  }

  return true
}

export default validateDecimal
