import { MAX_NETWORK_NAME_LENGTH } from 'utils/const'
import { FieldRequiredException, FieldUsedException, FieldTooLongException } from 'exceptions'

export const validateNetworkName = (name: string, usedNames: string[]) => {
  const FIELD_NAME = 'name'
  if (!name) {
    throw new FieldRequiredException(FIELD_NAME)
  }
  if (usedNames.includes(name)) {
    throw new FieldUsedException(FIELD_NAME, name)
  }
  if (name.length > MAX_NETWORK_NAME_LENGTH) {
    throw new FieldTooLongException(FIELD_NAME, MAX_NETWORK_NAME_LENGTH)
  }
  return true
}

export default validateNetworkName
