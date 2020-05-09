import React, { useState } from 'react'
import { Stack, Dropdown, Toggle, Icon, IDropdownOption } from 'office-ui-fabric-react'
import TextField from 'widgets/TextField'
import { useTranslation } from 'react-i18next'
import { Price, localNumberFormatter } from 'utils'

interface TransactionFee {
  fee: string
  price: string
  onPriceChange: any
}

const calculateSpeed = (price: number) => {
  if (price >= 16000) {
    return Price.Immediately
  }
  if (price >= 4000) {
    return Price.TenBlocks
  }
  if (price >= 2000) {
    return Price.HundredBlocks
  }
  return Price.FiveHundredsBlocks
}

const TransactionFee: React.FunctionComponent<TransactionFee> = ({ price, fee, onPriceChange }: TransactionFee) => {
  const [t] = useTranslation()
  const [showDetail, setShowDetail] = useState(false)

  const selectedSpeed = calculateSpeed(+price)

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
          label={t('send.expected-speed')}
          selectedKey={selectedSpeed}
          options={[
            { key: Price.Immediately, text: 'immediately' },
            { key: Price.TenBlocks, text: '~ 10 blocks' },
            { key: Price.HundredBlocks, text: '~ 100 blocks' },
            { key: Price.FiveHundredsBlocks, text: '~ 500 blocks' },
          ]}
          onRenderCaretDown={() => {
            return <Icon iconName="ArrowDown" />
          }}
          onChange={(e: any, item?: IDropdownOption) => {
            if (item) {
              e.target.value = item.key
              onPriceChange(e)
            }
          }}
          aria-label="expected speed"
          styles={{
            label: {
              fontSize: '0.75rem',
              fontWeight: 500,
            },

            title: {
              fontSize: '0.75rem!important',
              fontWeight: 500,
              height: '1.625rem',
              lineHeight: '1.625rem',
            },
            dropdownOptionText: {
              fontSize: '0.75rem!important',
              boxShadow: 'border-box',
            },
            dropdownItem: {
              fontSize: '0.75rem!important',
              boxShadow: 'border-box',
              minHeight: 'auto',
            },
            dropdownItemSelected: {
              fontSize: '0.75rem!important',
              minHeight: 'auto',
              backgroundColor: '#e3e3e3',
            },
            root: {
              fontSize: '0.75rem',
              marginBottom: '10px',
            },
          }}
        />
      </Stack>
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
