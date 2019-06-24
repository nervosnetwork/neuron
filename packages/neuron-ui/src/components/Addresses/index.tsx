import React, { useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Table from 'widgets/Table'
import { appCalls } from 'services/UILayer'
import { useNeuronWallet } from 'utils/hooks'
import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

const DescriptionField = styled.input`
  padding: 0 5px;
  background: transparent;
  border: none;
  &:focus {
    box-shadow: inset 0px 0px 8px rgba(0, 0, 0, 0.3);
  }
`

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

  const [localDescriptions, setLocalDescriptions] = useState(addresses.map(addr => addr.description))

  const submitDescription = useCallback(
    (idx: number) => {
      if (addresses[idx].description === localDescriptions[idx]) return
      dispatch(
        actionCreators.updateDescription({
          key: addresses[idx].address,
          description: localDescriptions[idx],
        })
      )
    },
    [dispatch, localDescriptions, addresses]
  )

  const onDescriptionFieldBlur = useCallback(
    (idx: number): React.FocusEventHandler => () => {
      submitDescription(idx)
    },
    [submitDescription]
  )

  const onDescriptionPress = useCallback(
    (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key && e.key === 'Enter') {
        submitDescription(idx)
      }
    },
    [submitDescription]
  )

  const onDescriptionChange = useCallback(
    (idx: number) => (e: any) => {
      const newDesc = localDescriptions.map((desc, index) => {
        if (index !== idx) return desc
        return e.currentTarget.value
      })
      setLocalDescriptions(newDesc)
    },
    [localDescriptions, setLocalDescriptions]
  )

  const addressesItems = useMemo(
    () =>
      addresses.map(({ type, identifier, address, txCount, description }, idx) => ({
        type: type === 0 ? t('addresses.receiving-address') : t('addresses.change-address'),
        address: <AddressPanel address={address} />,
        identifier,
        description: (
          <DescriptionField
            type="text"
            title={description}
            value={localDescriptions[idx]}
            onKeyPress={onDescriptionPress(idx)}
            onBlur={onDescriptionFieldBlur(idx)}
            onChange={onDescriptionChange(idx)}
            maxLength={100}
          />
        ),
        balance: '0',
        transactions: txCount,
        key: identifier,
      })),
    [addresses, onDescriptionChange, localDescriptions, onDescriptionFieldBlur, onDescriptionPress, t]
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
