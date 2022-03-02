import { t } from 'i18next'
import shannonToCKB from 'utils/shannonToCKB'
import sudtValueToAmount from 'utils/sudt-value-to-amount'
import Transaction from 'models/chain/transaction'
import { DEFAULT_UDT_SYMBOL } from 'utils/const'

export const formatDatetime = (datetime: Date) => {
  const isoFmt = datetime.toISOString()
  return `${isoFmt.substr(0, 10)} ${isoFmt.substr(11, 12)}`
}

const toCSVRow = (
  tx: Pick<Transaction, 'blockNumber' | 'hash' | 'description' | 'timestamp' | 'sudtInfo' | 'nervosDao' | 'value'>,
  includeSUDT: boolean = false
) => {
  const SEND_TYPE = t('export-transactions.tx-type.send')
  const RECEIVE_TYPE = t('export-transactions.tx-type.receive')

  const datetime = tx.timestamp ? formatDatetime(new Date(+tx.timestamp)) : ''
  const { blockNumber = '', hash = '', description = '' } = tx
  let amount = ''
  let sUDTAmount = ''
  let txType = ''
  if (tx.sudtInfo?.sUDT) {
    txType = +tx.sudtInfo.amount <= 0 ? `UDT ${SEND_TYPE}` : `UDT ${RECEIVE_TYPE}`
    const symbol = tx.sudtInfo.sUDT.symbol || DEFAULT_UDT_SYMBOL
    if (typeof tx.sudtInfo.sUDT.decimal === 'string') {
      sUDTAmount = `${sudtValueToAmount(tx.sudtInfo.amount, tx.sudtInfo.sUDT.decimal)} ${symbol}`
    } else {
      sUDTAmount = '--'
    }
  } else {
    amount = shannonToCKB(BigInt(tx.value))
    if (tx.nervosDao) {
      txType = `Nervos DAO`
    } else {
      txType = +(tx.value || 0) <= 0 ? SEND_TYPE : RECEIVE_TYPE
    }
  }

  const data = includeSUDT
    ? `${datetime},${blockNumber},${hash},${txType},${amount},${sUDTAmount},"${description}"\n`
    : `${datetime},${blockNumber},${hash},${txType},${amount},"${description}"\n`

  return data
}

export default toCSVRow
