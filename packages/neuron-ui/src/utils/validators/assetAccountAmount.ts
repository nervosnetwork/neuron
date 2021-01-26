import { AmountZeroException, FieldRequiredException, FieldInvalidException } from 'exceptions'
import { sudtAmountToValue } from 'utils/formatters'

export const validateAssetAccountAmount = ({
  amount,
  decimal,
  required = false,
}: {
  amount: string
  decimal: string
  required: boolean
}) => {
  const fieldName = 'amount'

  if (!amount && required) {
    throw new FieldRequiredException(fieldName)
  }

  if (amount === '0') {
    throw new AmountZeroException()
  }

  if (Number.isNaN(+amount) || +amount < 0) {
    throw new FieldInvalidException(fieldName)
  }

  if (sudtAmountToValue(amount, decimal) === undefined) {
    throw new FieldInvalidException(fieldName)
  }

  return true
}

export default validateAssetAccountAmount
