import { SINCE_FIELD_SIZE } from 'utils/const'
import validateAddress from './address'
import validateAmount from './amount'
import validateAmountRange from './amountRange'

export const validateOutputs = (
  items: Readonly<Omit<State.Output, 'unit'>[]> = [],
  isMainnet: boolean = false,
  ignoreLastAmount: boolean = false
) => {
  for (let i = 0; i < items.length; i++) {
    try {
      if (items[i].address) {
        validateAddress(items[i].address || '', isMainnet)
      }
      if (i !== items.length - 1 || !ignoreLastAmount) {
        validateAmount(items[i].amount)

        const extraSize = items[i].date ? SINCE_FIELD_SIZE : 0
        validateAmountRange(items[i].amount, extraSize)
      }
    } catch {
      throw new Error(`Invalid output index: ${i}`)
    }
  }
  return true
}

export default validateOutputs
