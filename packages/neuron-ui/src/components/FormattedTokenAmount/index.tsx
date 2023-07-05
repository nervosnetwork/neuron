import React from 'react'

import { UANTonkenSymbol } from 'components/UANDisplay'
import CopyZone from 'widgets/CopyZone'

import {
  shannonToCKBFormatter,
  sudtValueToAmount,
  sUDTAmountFormatter,
  nftFormatter,
  complexNumberToPureNumber,
} from 'utils'
import { HIDE_BALANCE } from 'utils/const'

import styles from './formattedTokenAmount.module.scss'

type FormattedTokenAmountProps = { item: State.Transaction; show: boolean; isNeedCopy?: boolean }
type AmountProps = Omit<FormattedTokenAmountProps, 'isNeedCopy'> & {
  sudtAmount: string
  isReceive: boolean
  amount: string
}

const Amount = ({ sudtAmount, show, item, isReceive, amount }: AmountProps) => {
  return sudtAmount ? (
    <div className={show && !sudtAmount.includes('-') ? styles.isReceive : ''}>
      {show ? `${!sudtAmount.includes('-') ? '+' : ''}${sudtAmount}` : HIDE_BALANCE}&nbsp;
      <UANTonkenSymbol name={item.sudtInfo!.sUDT.tokenName} symbol={item.sudtInfo!.sUDT.symbol} />
    </div>
  ) : (
    <span className={show && isReceive ? styles.isReceive : ''}>{amount}</span>
  )
}

export const FormattedTokenAmount = ({ item, show, isNeedCopy }: FormattedTokenAmountProps) => {
  let amount = '--'
  let sudtAmount = ''
  let isReceive = false

  if (item.blockNumber !== undefined) {
    if (item.nftInfo) {
      // NFT
      const { type, data } = item.nftInfo
      amount = show ? `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}` : `${HIDE_BALANCE}mNFT`
      isReceive = type === 'receive'
    } else if (item.sudtInfo?.sUDT) {
      if (item.sudtInfo.sUDT.decimal) {
        sudtAmount = sUDTAmountFormatter(sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal))
      }
    } else {
      amount = show ? `${shannonToCKBFormatter(item.value, true)} CKB` : `${HIDE_BALANCE} CKB`
      isReceive = !amount.includes('-')
    }
  }

  const props = { sudtAmount, show, item, isReceive, amount }

  return isNeedCopy ? (
    <CopyZone content={`${complexNumberToPureNumber(sudtAmount || amount)}`}>
      <Amount {...props} />
    </CopyZone>
  ) : (
    <Amount {...props} />
  )
}

FormattedTokenAmount.displayName = 'FormattedTokenAmount'

export default FormattedTokenAmount
