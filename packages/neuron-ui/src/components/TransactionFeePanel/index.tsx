import React, { useState } from 'react'
import { Stack, Label, TextField, Dropdown, Toggle, Icon, IDropdownOption } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

interface TransactionFee {
  fee: string
  price: string
  onPriceChange: any
}

const calculateSpeed = (price: number) => {
  if (price >= 16000) {
    return '18000'
  }
  if (price >= 4000) {
    return '6000'
  }
  if (price >= 2000) {
    return '3000'
  }
  return '0'
}

const TransactionFee: React.FunctionComponent<TransactionFee> = ({ price, fee, onPriceChange }: TransactionFee) => {
  const [t] = useTranslation()
  const [showDetail, setShowDetail] = useState(false)
  const leftStackWidth = '70%'
  const labelWidth = '140px'
  const actionSpacer = (
    <Stack.Item styles={{ root: { width: '48px' } }}>
      <span> </span>
    </Stack.Item>
  )

  const selectedSpeed = calculateSpeed(+price)

  return (
    <Stack tokens={{ childrenGap: 15 }} aria-label="transaction fee">
      <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { width: leftStackWidth } }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.fee')}</Label>
          </Stack.Item>
          <Stack.Item grow>
            <TextField
              value={`${fee} CKB`}
              readOnly
              styles={{
                field: {
                  color: '#888',
                },
                fieldGroup: {
                  borderColor: '#eee!important',
                },
              }}
            />
          </Stack.Item>
          {actionSpacer}
        </Stack>

        <Stack.Item>
          <Toggle
            onChange={() => {
              setShowDetail(!showDetail)
            }}
            label={t('send.advanced-fee-settings')}
            inlineLabel
          />
        </Stack.Item>
      </Stack>

      <Stack
        tokens={{ childrenGap: 15 }}
        styles={{
          root: {
            maxHeight: showDetail ? '100vw' : '0',
            width: leftStackWidth,
            overflow: 'hidden',
          },
        }}
      >
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.price')}</Label>
          </Stack.Item>
          <Stack.Item grow>
            <TextField value={price} onChange={onPriceChange} aria-label="price" suffix="shannons/kB" />
          </Stack.Item>
          {actionSpacer}
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.expected-speed')}</Label>
          </Stack.Item>
          <Stack.Item>
            <Dropdown
              dropdownWidth={140}
              selectedKey={selectedSpeed}
              options={[
                { key: '18000', text: 'immediately' },
                { key: '6000', text: '~ 10 blocks' },
                { key: '3000', text: '~ 100 blocks' },
                { key: '0', text: '~ 500 blocks' },
              ]}
              onRenderCaretDown={() => {
                return <Icon iconName="ArrowDown" />
              }}
              onChange={(e: any, item?: IDropdownOption) => {
                if (item) {
                  onPriceChange(e, item.key)
                }
              }}
              aria-label="expected speed"
            />
          </Stack.Item>
        </Stack>
      </Stack>
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
