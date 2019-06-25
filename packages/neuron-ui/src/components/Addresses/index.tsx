import React, { useMemo } from 'react'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Table from 'widgets/Table'
import { appCalls } from 'services/UILayer'
import { useNeuronWallet, useLocalDescription } from 'utils/hooks'
import { ContentProps } from 'containers/MainContent'

import DescriptionField from 'widgets/InlineInput/DescriptionField'

const headers = [
  {
    label: 'addresses.type',
    key: 'type',
  },
  {
    label: 'addresses.address',
    key: 'address',
  },
  {
    label: 'addresses.identifier',
    key: 'identifier',
  },
  {
    label: 'addresses.description',
    key: 'description',
  },
  {
    label: 'addresses.balance',
    key: 'balance',
  },
  {
    label: 'addresses.transactions',
    key: 'transactions',
  },
]

const onPageChange = () => {}
const AddressPanel = ({ address }: { address: string }) => {
  return <div onContextMenu={() => appCalls.contextMenu({ type: 'addressList', id: address })}>{address}</div>
}

const Addresses = ({ dispatch }: React.PropsWithoutRef<ContentProps>) => {
  const {
    wallet: { addresses },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'address',
    addresses.map(({ address: key, description }) => ({
      key,
      description,
    })),
    dispatch
  )

  const addressesItems = useMemo(
    () =>
      addresses.map(({ type, identifier, address, txCount, balance, description }, idx) => ({
        type: type === 0 ? t('addresses.receiving-address') : t('addresses.change-address'),
        address: <AddressPanel address={address} />,
        identifier,
        description: (
          <DescriptionField
            type="text"
            title={description}
            value={localDescription[idx]}
            onKeyPress={onDescriptionPress(idx)}
            onBlur={onDescriptionFieldBlur(idx)}
            onChange={onDescriptionChange(idx)}
            maxLength={100}
          />
        ),
        balance,
        transactions: txCount,
        key: identifier,
      })),
    [addresses, onDescriptionChange, localDescription, onDescriptionFieldBlur, onDescriptionPress, t]
  )

  return (
    <Container>
      <h2>{t('addresses.addresses')}</h2>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={addressesItems}
        pageNo={0}
        pageSize={addressesItems.length}
        totalCount={addressesItems.length}
        onPageChange={onPageChange}
        tableAttrs={{
          bordered: false,
          striped: true,
        }}
      />
    </Container>
  )
}

export default Addresses
