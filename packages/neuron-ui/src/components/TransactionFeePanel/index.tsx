import React, { useState } from 'react'
import { Stack, Label, TextField, Dropdown, IconButton, Icon } from 'office-ui-fabric-react'
import { CaretDown, Down } from 'grommet-icons'
import { useTranslation } from 'react-i18next'

import { registerIcons } from 'utils/icons'

interface TransactionFee {
  fee: string
  cycles: string
  price: string
  onPriceChange: any
}

registerIcons({
  icons: {
    ArrowDown: <Down size="small" />,
  },
})

const TransactionFee: React.FunctionComponent<TransactionFee> = ({
  cycles,
  price,
  fee,
  onPriceChange,
}: TransactionFee) => {
  const [t] = useTranslation()
  const [showDetail, setShowDetail] = useState(false)
  const leftStackWidth = '70%'
  const labelWidth = '140px'
  const actionSpacer = (
    <Stack.Item styles={{ root: { width: '48px' } }}>
      <span> </span>
    </Stack.Item>
  )

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { width: leftStackWidth } }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.fee')}</Label>
          </Stack.Item>
          <Stack.Item grow>
            <TextField value={fee} readOnly />
          </Stack.Item>
          {actionSpacer}
        </Stack>

        <Stack.Item>
          <IconButton onClick={() => setShowDetail(!showDetail)}>
            <CaretDown
              onClick={() => setShowDetail(!showDetail)}
              style={{
                transform: showDetail ? 'rotate(180deg)' : 'none',
              }}
            />
          </IconButton>
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
            <TextField type="number" value={price} onChange={onPriceChange} />
          </Stack.Item>
          {actionSpacer}
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.expected-speed')}</Label>
          </Stack.Item>
          <Stack.Item>
            <Dropdown
              defaultSelectedKey="0"
              options={[
                { key: '0', text: 'immediately' },
                { key: '30', text: '~ 30s' },
                { key: '60', text: '~ 1min' },
                { key: '180', text: '~ 3min' },
              ]}
              onRenderCaretDown={() => {
                return <Icon iconName="ArrowDown" />
              }}
            />
          </Stack.Item>
        </Stack>

        <Stack>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 20 }}>
            <Stack.Item styles={{ root: { width: labelWidth } }}>
              <Label>{t('send.total-cycles')}</Label>
            </Stack.Item>
            <Stack.Item>{cycles}</Stack.Item>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
