import { DEFAULT_SUDT_FIELDS, MAX_SUDT_TOKEN_NAME_LENGTH } from 'utils/const'
import { FieldRequiredException, ValueReservedException, FieldTooLongException } from 'exceptions'

export const validateTokenName = ({
  tokenName,
  required = false,
  isCKB = false,
}: {
  tokenName: string
  required?: boolean
  isCKB?: boolean
}) => {
  const fieldName = 'token-name'

  if (!tokenName && required) {
    throw new FieldRequiredException(fieldName)
  }

  if (DEFAULT_SUDT_FIELDS.tokenName === tokenName) {
    throw new ValueReservedException(tokenName)
  }

  if (DEFAULT_SUDT_FIELDS.CKBTokenName === tokenName && !isCKB) {
    throw new ValueReservedException(tokenName)
  }

  if (tokenName.length > MAX_SUDT_TOKEN_NAME_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SUDT_TOKEN_NAME_LENGTH)
  }

  return true
}

export default validateTokenName
