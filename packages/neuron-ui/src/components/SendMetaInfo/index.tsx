import React from 'react'
import { useTranslation } from 'react-i18next'

import TransactionFeePanel from 'components/TransactionFeePanel'
import TextField from 'widgets/TextField'

import { shannonToCKBFormatter } from 'utils'

import styles from './sendMetaInfo.module.scss'

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
        <div className={styles.totalAmountField}>
          <p className={styles.title}>{t('send.total-amount')}</p>
          <p className={styles.value}>{shannonToCKBFormatter(totalAmount)}</p>
          <p className={styles.errorMessage}>{errorMessage}</p>
        </div>
      ) : null}
      <TextField
        placeholder={t('send.description-optional')}
        className={styles.textFieldClass}
        field="description"
        label={t('send.description')}
        value={description}
        onChange={handleDescriptionChange}
        disabled={sending}
        width="100%"
      />
      <TransactionFeePanel fee={shannonToCKBFormatter(fee)} price={price} onPriceChange={handlePriceChange} />
    </>
  )
}

SendMetaInfo.displayName = 'SendMetaInfo'

export default SendMetaInfo
