import { MAX_SUDT_ACCOUNT_NAME_LENGTH, DEFAULT_SUDT_FIELDS } from 'utils/const'
import { FieldRequiredException, ValueReservedException, FieldTooLongException, FieldUsedException } from 'exceptions'

export const validateSUDTAccountName = ({
  name = '',
  exists = [],
  required = false,
}: {
  name: string
  exists?: string[]
  required?: boolean
}) => {
  const fieldName = 'account-name'
  if (!name && required) {
    throw new FieldRequiredException(fieldName)
  }

  if (name === DEFAULT_SUDT_FIELDS.accountName) {
    throw new ValueReservedException(name)
  }

  if (exists.includes(name)) {
    throw new FieldUsedException(fieldName)
  }

  if (name.length > MAX_SUDT_ACCOUNT_NAME_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SUDT_ACCOUNT_NAME_LENGTH)
  }
  return true
}

export default validateSUDTAccountName
