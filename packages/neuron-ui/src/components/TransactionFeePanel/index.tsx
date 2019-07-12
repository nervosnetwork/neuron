import React, { useState } from 'react'
import { Stack, Label, TextField, Dropdown } from 'office-ui-fabric-react'
import { CaretDown } from 'grommet-icons'
import { useTranslation } from 'react-i18next'

interface TransactionFee {
  fee: string
  cycles: string
  price: string
  onPriceChange: any
}

const TransactionFee: React.FunctionComponent<TransactionFee> = ({
  cycles,
  price,
  fee,
  onPriceChange,
}: TransactionFee) => {
  const [t] = useTranslation()
  const [showDetail, setShowDetail] = useState(false)
  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <Stack.Item>
          <Label>{t('send.fee')}</Label>
        </Stack.Item>
        <Stack.Item grow>
          <TextField value={fee} readOnly />
        </Stack.Item>
        <Stack.Item>
          <CaretDown
            onClick={() => setShowDetail(!showDetail)}
            style={{
              transform: showDetail ? 'rotate(180deg)' : 'none',
            }}
          />
        </Stack.Item>
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
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item>
            <Label>{t('send.price')}</Label>
          </Stack.Item>
          <Stack.Item grow>
            <TextField type="number" value={price} onChange={onPriceChange} />
          </Stack.Item>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <Stack.Item>
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
            />
          </Stack.Item>
        </Stack>
        <Stack>
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack.Item>{t('send.total-cycles')}</Stack.Item>
            <Stack.Item>{cycles}</Stack.Item>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
