import React from 'react'
import { UANTokenName } from 'components/UANDisplay'
import { Trans, useTranslation } from 'react-i18next'
import { CONFIRMATION_THRESHOLD } from 'utils/const'

const genTypeLabel = (
  type: 'send' | 'receive' | 'create' | 'destroy',
  status: 'pending' | 'confirming' | 'success' | 'failed'
) => {
  switch (type) {
    case 'send': {
      if (status === 'failed') {
        return 'sent'
      }
      if (status === 'pending' || status === 'confirming') {
        return 'sending'
      }
      return 'sent'
    }
    case 'receive': {
      if (status === 'failed') {
        return 'received'
      }
      if (status === 'pending' || status === 'confirming') {
        return 'receiving'
      }
      return 'received'
    }
    default:
      return type
  }
}

const TransactionType = ({
  item,
  cacheTipBlockNumber,
  bestKnownBlockNumber,
  tokenNameClassName,
}: {
  item: Omit<State.Transaction, 'status'> & { status: State.Transaction['status'] | 'confirming' }
  cacheTipBlockNumber: number
  bestKnownBlockNumber: number
  tokenNameClassName?: string
}) => {
  const [t] = useTranslation()
  let typeLabel: string = '--'
  let { status } = item
  let typeTransProps: {
    i18nKey: string
    components: JSX.Element[]
  } = {
    i18nKey: '',
    components: [],
  }

  if (item.blockNumber !== undefined) {
    const confirmationCount =
      item.blockNumber === null || item.status === 'failed'
        ? 0
        : 1 + Math.max(cacheTipBlockNumber, bestKnownBlockNumber) - +item.blockNumber

    if (status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD) {
      status = 'confirming'
    }
    if (item.nftInfo) {
      // NFT
      const { type } = item.nftInfo
      typeLabel = `${t(`overview.${genTypeLabel(type, status)}`)}`
    } else if (item.sudtInfo?.sUDT) {
      // Asset Account
      if (['create', 'destroy'].includes(item.type)) {
        // create/destroy an account
        typeTransProps = {
          i18nKey: `overview.${item.type}SUDT`,
          components: [
            <UANTokenName
              name={item.sudtInfo.sUDT.tokenName || 'Unknown'}
              symbol={item.sudtInfo.sUDT.symbol}
              className={tokenNameClassName}
            />,
          ],
        }
      } else {
        // send/receive to/from an account
        const type = +item.sudtInfo.amount <= 0 ? 'send' : 'receive'
        typeLabel = `UDT ${t(`overview.${genTypeLabel(type, status)}`)}`
      }
    } else if (item.type === 'create' || item.type === 'destroy') {
      // normal tx
      if (item.assetAccountType === 'CKB') {
        typeLabel = `${t(`overview.${item.type}`, { name: 'CKB' })}`
      } else {
        typeLabel = `${t(`overview.${item.type}`, { name: 'Unknown' })}`
      }
    } else {
      typeLabel = item.nervosDao ? 'Nervos DAO' : t(`overview.${genTypeLabel(item.type, status)}`)
    }
  }
  return typeTransProps.i18nKey ? <Trans {...typeTransProps} /> : <>{typeLabel}</>
}

TransactionType.displayName = 'TransactionType'

export default TransactionType
