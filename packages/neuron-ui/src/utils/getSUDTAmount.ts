import { sudtValueToAmount, toUint128Le } from 'utils'

export const getSUDTAmount = ({
  tokenInfo,
  data,
}: {
  tokenInfo?: Controller.GetTokenInfoList.TokenInfo
  data: string
}) => {
  let amount = BigInt(toUint128Le(data)).toString()
  let amountToCopy = amount
  if (tokenInfo) {
    amount = `${sudtValueToAmount(amount, tokenInfo.decimal)} ${tokenInfo.symbol}`
    amountToCopy = sudtValueToAmount(amountToCopy, tokenInfo.decimal, false, '')
  }
  return {
    amount,
    amountToCopy,
  }
}

export default { getSUDTAmount }
