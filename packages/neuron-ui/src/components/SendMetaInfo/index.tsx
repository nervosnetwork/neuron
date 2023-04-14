import React from 'react'
import { useTranslation } from 'react-i18next'

import TransactionFeePanel from 'components/TransactionFeePanel'
import TextField from 'widgets/TextField'

import { shannonToCKBFormatter } from 'utils'

interface SendMetaInfoProps {
  outputs: unknown[]
  errorMessage: string
  totalAmount: string
  sending: boolean
  description: string
  fee: string
  price: string
  handleDescriptionChange: React.EventHandler<React.SyntheticEvent>
  handlePriceChange: (value: string) => void
}

const SendMetaInfo = ({
  outputs,
  errorMessage,
  totalAmount,
  sending,
  handleDescriptionChange,
  description,
  handlePriceChange,
  fee,
  price,
}: SendMetaInfoProps) => {
  const [t] = useTranslation()
  return (
    <>
      {outputs.length > 1 || errorMessage ? (
        <TextField
          field="totalAmount"
          label={t('send.total-amount')}
          value={`${shannonToCKBFormatter(totalAmount)} CKB`}
          readOnly
          error={errorMessage}
        />
      ) : null}
      <TransactionFeePanel fee={shannonToCKBFormatter(fee)} price={price} onPriceChange={handlePriceChange} />
      <TextField
        field="description"
        label={t('send.description')}
        value={description}
        onChange={handleDescriptionChange}
        disabled={sending}
      />
    </>
  )
}

SendMetaInfo.displayName = 'SendMetaInfo'

export default SendMetaInfo
