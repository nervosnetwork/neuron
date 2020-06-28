import { DEFAULT_SUDT_FIELDS, MAX_SYMBOL_LENGTH } from 'utils/const'
import {
  FieldRequiredException,
  FieldTooLongException,
  FieldInvalidException,
  ValueReservedException,
} from 'exceptions'

export const validateSymbol = ({
  symbol,
  required = false,
  isCKB = false,
}: {
  symbol: string
  required?: boolean
  isCKB?: boolean
}) => {
  const fieldName = 'symbol'

  if (!symbol && required) {
    throw new FieldRequiredException(fieldName)
  }

  if (DEFAULT_SUDT_FIELDS.symbol === symbol) {
    throw new ValueReservedException(symbol)
  }

  if (DEFAULT_SUDT_FIELDS.CKBSymbol === symbol && !isCKB) {
    throw new ValueReservedException(symbol)
  }

  if (symbol.length > MAX_SYMBOL_LENGTH) {
    throw new FieldTooLongException(fieldName, MAX_SYMBOL_LENGTH)
  }

  if ([...symbol].some(char => char.charCodeAt(0) > 127)) {
    throw new FieldInvalidException(fieldName)
  }
  return true
}

export default validateSymbol
