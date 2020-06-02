import React, { useState } from 'react'
import { Stack, Toggle, IDropdownOption } from 'office-ui-fabric-react'
import Dropdown from 'widgets/Dropdown'
import TextField from 'widgets/TextField'
import { useTranslation } from 'react-i18next'
import { Price, localNumberFormatter } from 'utils'

interface TransactionFee {
  fee: string
  price: string
  onPriceChange: any
}

const TransactionFee: React.FunctionComponent<TransactionFee> = ({ price, fee, onPriceChange }: TransactionFee) => {
  const [t] = useTranslation()
  const [showDetail, setShowDetail] = useState(false)

  return (
    <Stack tokens={{ childrenGap: 15 }} aria-label="transaction fee">
      <Stack tokens={{ childrenGap: 15 }}>
        <TextField label={t('send.fee')} field="fee" value={`${fee} CKB`} readOnly disabled />

        <Toggle
          onChange={() => {
            setShowDetail(!showDetail)
          }}
          label={t('send.advanced-fee-settings')}
          inlineLabel
          onText=" "
          offText=" "
          styles={{
            label: {
              fontSize: 14,
              fontWeight: 500,
            },
          }}
        />
      </Stack>

      <Stack
        tokens={{ childrenGap: 15 }}
        styles={{
          root: {
            maxHeight: showDetail ? '100vw' : '0',
            overflow: 'hidden',
          },
        }}
      >
        <TextField
          required
          label={t('send.price')}
          field="price"
          value={localNumberFormatter(price)}
          onChange={onPriceChange}
          suffix="shannons/kB"
        />

        <Dropdown
          label={t('send.pick-price')}
          selectedKey={price}
          options={[
            { key: Price.High, text: Price.High },
            { key: Price.Medium, text: Price.Medium },
            { key: Price.Low, text: Price.Low },
            { key: Price.Zero, text: Price.Zero },
          ]}
          onChange={(e: any, item?: IDropdownOption) => {
            if (item) {
              e.target.value = item.key
              onPriceChange(e)
            }
          }}
          aria-label="expected speed"
        />
      </Stack>
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
