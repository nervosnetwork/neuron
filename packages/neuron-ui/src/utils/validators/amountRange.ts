import { CKBToShannonFormatter, localNumberFormatter } from 'utils/formatters'
import { MIN_AMOUNT, SHANNON_CKB_RATIO } from 'utils/const'
import { AmountTooSmallException } from 'exceptions'

export const validateAmountRange = (amount: string = '', extraSize: number = 0) => {
  const requiredAmount = MIN_AMOUNT + extraSize
  const requiredShannon = BigInt(requiredAmount * SHANNON_CKB_RATIO)
  if (BigInt(CKBToShannonFormatter(amount)) >= requiredShannon) {
    return true
  }
  throw new AmountTooSmallException(localNumberFormatter(amount), localNumberFormatter(requiredAmount))
}

export default validateAmountRange
