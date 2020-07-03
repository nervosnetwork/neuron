import { BalanceNotEnoughException } from 'exceptions/index'

export const validateTotalAmount = (totalAmount: string, fee: string, balance: string) => {
  if (BigInt(balance) < BigInt(0)) {
    throw new BalanceNotEnoughException()
  }
  if (BigInt(totalAmount) + BigInt(fee) <= BigInt(balance)) {
    return true
  }
  throw new BalanceNotEnoughException()
}

export default validateTotalAmount
