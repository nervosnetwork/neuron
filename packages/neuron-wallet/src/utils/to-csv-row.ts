import shannonToCKB from 'utils/shannonToCKB'
import sudtValueToAmount from 'utils/sudt-value-to-amount'

export const formatDatetime = (datetime: Date) => {
  const isoFmt = datetime.toISOString()
  return `${isoFmt.substr(0, 10)} ${isoFmt.substr(11, 12)}`
}
interface RowProps {
  hash: string
  inputShannon: string | null
  outputShannon: string | null
  includeSUDT: boolean
  sUDTValue: string
  daoCellCount: number
  RECEIVE_TYPE: string
  SEND_TYPE: string
  tokenInfoList: any[]
  timestamp: string
  blockNumber: string
  typeArgs: string | null
  description: string
}

const toCSVRow = ({
  description,
  hash,
  inputShannon,
  outputShannon,
  includeSUDT,
  sUDTValue,
  daoCellCount,
  RECEIVE_TYPE,
  SEND_TYPE,
  tokenInfoList,
  timestamp,
  blockNumber,
  typeArgs
}: RowProps) => {

  const totalInput = BigInt(inputShannon || `0`)
  const totalOutput = BigInt(outputShannon || `0`)
  let txType = `-`
  if (includeSUDT && sUDTValue !== '') {
    txType = 'UDT ' + (BigInt(sUDTValue) > 0 ? RECEIVE_TYPE : SEND_TYPE)
  } else if (daoCellCount > 0) {
    txType = 'Nervos DAO'
  } else if (totalInput >= totalOutput) {
    txType = SEND_TYPE
  } else {
    txType = RECEIVE_TYPE
  }

  const DEFAULT_SYMBOL = 'Unknown'
  const amount = includeSUDT && sUDTValue !== '' ? '' : shannonToCKB(totalOutput - totalInput)

  const tokenInfo = tokenInfoList.find((info: { tokenID: string }) => info.tokenID === typeArgs)
  const decimal = tokenInfo?.decimal
  const symbol = tokenInfo?.symbol || DEFAULT_SYMBOL
  const sUDTAmount = sUDTValue === '' ? '' : `${sudtValueToAmount(sUDTValue, decimal)} ${symbol}`

  const data = includeSUDT
    ? `${formatDatetime(new Date(+timestamp))},${blockNumber},${hash},${txType},${amount},${sUDTAmount},"${description}"\n`
    : `${formatDatetime(new Date(+timestamp))},${blockNumber},${hash},${txType},${amount},"${description}"\n`

  return data
}
export default toCSVRow
