import React from 'react'
import TextField from 'widgets/TextField'
import PricePanel from 'components/PricePanel'
import { useTranslation } from 'react-i18next'

interface TransactionFeeProps {
  fee: string
  price: string
  onPriceChange: (value: string) => void
}

const TransactionFeePanel: React.FunctionComponent<TransactionFeeProps> = ({
  price,
  fee,
  onPriceChange,
}: TransactionFeeProps) => {
  const [t] = useTranslation()

  return (
    <div>
      <TextField label={t('send.fee')} field="fee" value={`${fee} CKB`} readOnly disabled width="100%" />
      <PricePanel field="price" price={price} onPriceChange={onPriceChange} />
    </div>
  )
}

TransactionFeePanel.displayName = 'TransactionFeePanel'

export default TransactionFeePanel
