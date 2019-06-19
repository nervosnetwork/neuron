import React, { useCallback, useMemo } from 'react'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Table from 'widgets/Table'
import { appCalls } from 'services/UILayer'
import { useNeuronWallet } from 'utils/hooks'
import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

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

const AddressPanel = ({ address }: { address: string }) => {
  return <div onContextMenu={() => appCalls.contextMenu({ type: 'addressList', id: address })}>{address}</div>
}

const Addresses = ({ dispatch }: React.PropsWithoutRef<ContentProps>) => {
  const {
    wallet: {
      addresses: { receiving, change },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const onPageChange = useCallback(() => {}, [])
  const onDescriptionUpdate = useCallback(
    (address: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        dispatch(
          actionCreators.updateDescription({
            key: address,
            description: 'Discriptiont to update',
          })
        )
      } else {
        // TODO: update the description
      }
    },
    []
  )

  const receivingAddresses = useMemo(
    () =>
      receiving.map(address => ({
        type: 'Receiving',
        address: <AddressPanel address={address} />,
        description: <input type="text" value="" onKeyPress={onDescriptionUpdate(address)} />,
        balance: '0',
        transactions: '0',
        key: address,
      })),
    [receiving]
  )

  const changeAddresses = useMemo(
    () =>
      change.map(address => ({
        type: 'Change',
        address: <AddressPanel address={address} />,
        balance: '0',
        transactions: '0',
        key: address,
      })),
    [change]
  )

  const count = useMemo(() => receiving.length + change.length, [receiving, change])

  return (
    <Container>
      <h2>{t('addresses.addresses')}</h2>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={[...receivingAddresses, ...changeAddresses]}
        pageNo={0}
        pageSize={count}
        totalCount={count}
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
