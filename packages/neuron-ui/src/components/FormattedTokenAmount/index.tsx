import React from 'react'

import { UANTonkenSymbol } from 'components/UANDisplay'
import CopyZone from 'widgets/CopyZone'

import { shannonToCKBFormatter, sudtValueToAmount, sUDTAmountFormatter, nftFormatter } from 'utils'
import { HIDE_BALANCE } from 'utils/const'

import styles from './formattedTokenAmount.module.scss'

type FormattedTokenAmountProps = { item: State.Transaction; show: boolean; symbolClassName?: string; symbol?: string }
type AmountProps = Omit<FormattedTokenAmountProps, 'isNeedCopy'> & {
  sudtAmount?: string
  isReceive: boolean
  amount: string
  symbolClassName?: string
}

const Amount = ({ sudtAmount, show, item, isReceive, amount, symbolClassName, symbol }: AmountProps) => {
  return sudtAmount ? (
    <div>
      <span className={show ? styles.amount : ''} data-direction={isReceive ? 'receive' : 'send'}>
        {show ? `${isReceive ? '+' : ''}${sudtAmount}` : HIDE_BALANCE}&nbsp;
      </span>
      <UANTonkenSymbol
        className={symbolClassName}
        name={item.sudtInfo!.sUDT.tokenName}
        symbol={item.sudtInfo!.sUDT.symbol}
      />
    </div>
  ) : (
    <div>
      <span className={show ? styles.amount : ''} data-direction={isReceive ? 'receive' : 'send'}>
        {amount}
      </span>
      &nbsp;{symbol}
    </div>
  )
}

export const FormattedTokenAmount = ({ item, show, symbolClassName }: FormattedTokenAmountProps) => {
  let amount = '--'
  let sudtAmount = ''
  let copyText = amount
  let isReceive = false
  let symbol = ''

  if (item.blockNumber !== undefined) {
    if (item.nftInfo) {
      // NFT
      const { type, data } = item.nftInfo
      amount = show ? `${type === 'receive' ? '+' : '-'}${nftFormatter(data)}` : `${HIDE_BALANCE}mNFT`
      copyText = amount
      symbol = amount.includes('mNFT') ? 'mNFT' : ''
      amount = amount.replace('mNFT', '')
      isReceive = type === 'receive'
    } else if (item.sudtInfo?.sUDT) {
      if (item.sudtInfo.sUDT.decimal) {
        sudtAmount = sUDTAmountFormatter(sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal))
        copyText = `${sudtValueToAmount(item.sudtInfo.amount, item.sudtInfo.sUDT.decimal)} ${item.sudtInfo.sUDT.symbol}`
        isReceive = !sudtAmount.includes('-')
      }
    } else {
      amount = show ? `${shannonToCKBFormatter(item.value, true)}` : `${HIDE_BALANCE}`
      isReceive = !amount.includes('-')
      copyText = `${amount} CKB`
      symbol = 'CKB'
    }
  }

  const props = { sudtAmount, show, item, isReceive, amount, symbolClassName, symbol }

  return show ? (
    <CopyZone content={copyText}>
      <Amount {...props} />
    </CopyZone>
  ) : (
    <Amount {...props} />
  )
}

export const FormattedCKBBalanceChange = ({ item, show, symbolClassName }: FormattedTokenAmountProps) => {
  let amount = '--'
  let copyText = amount
  let isReceive = false

  if (item.blockNumber !== undefined) {
    amount = show ? `${shannonToCKBFormatter(item.value, true)}` : `${HIDE_BALANCE}`
    isReceive = !amount.includes('-')
    copyText = amount
  }

  const props = { show, item, isReceive, amount, symbolClassName }

  return show ? (
    <CopyZone content={copyText}>
      <Amount {...props} />
    </CopyZone>
  ) : (
    <Amount {...props} />
  )
}

FormattedTokenAmount.displayName = 'FormattedTokenAmount'

export default FormattedTokenAmount
