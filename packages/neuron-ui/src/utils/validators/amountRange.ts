import { CKBToShannonFormatter } from 'utils/formatters'
import { MIN_AMOUNT, SHANNON_CKB_RATIO } from 'utils/const'
import { AmountTooSmallException } from 'exceptions'

export const validateAmountRange = (amount: string = '', extraSize: number = 0) => {
  const required = BigInt((MIN_AMOUNT + extraSize) * SHANNON_CKB_RATIO)
  if (BigInt(CKBToShannonFormatter(amount)) >= required) {
    return true
  }
  throw new AmountTooSmallException()
}

export default validateAmountRange
