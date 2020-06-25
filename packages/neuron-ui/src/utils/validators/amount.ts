import { CKBToShannonFormatter } from 'utils/formatters'
import { MAX_DECIMAL_DIGITS } from 'utils/const'
import { FieldInvalidException, AmountDecimalExceedException, AmountNegativeException } from 'exceptions'

export const validateAmount = (amount: string = '0') => {
  if (Number.isNaN(+amount)) {
    throw new FieldInvalidException('amount')
  }
  const [, decimal = ''] = amount.split('.')
  if (decimal.length > MAX_DECIMAL_DIGITS) {
    throw new AmountDecimalExceedException()
  }
  if (BigInt(CKBToShannonFormatter(amount)) < BigInt(0)) {
    throw new AmountNegativeException()
  }
  return true
}

export default validateAmount
