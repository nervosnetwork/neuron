import React from 'react'
import { Stack } from 'office-ui-fabric-react'
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
    <Stack tokens={{ childrenGap: 15 }} aria-label="transaction fee">
      <Stack tokens={{ childrenGap: 15 }}>
        <TextField label={t('send.fee')} field="fee" value={`${fee} CKB`} readOnly disabled />
      </Stack>
      <PricePanel field="price" price={price} onPriceChange={onPriceChange} />
    </Stack>
  )
}

TransactionFeePanel.displayName = 'TransactionFeePanel'

export default TransactionFeePanel
