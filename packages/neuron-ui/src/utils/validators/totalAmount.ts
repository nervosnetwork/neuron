import { AmountNotEnoughException } from 'exceptions'

export const validateTotalAmount = (totalAmount: string, fee: string, balance: string) => {
  if (BigInt(balance) < BigInt(0)) {
    throw new AmountNotEnoughException()
  }
  if (BigInt(totalAmount) + BigInt(fee) <= BigInt(balance)) {
    return true
  }
  throw new AmountNotEnoughException()
}

export default validateTotalAmount
