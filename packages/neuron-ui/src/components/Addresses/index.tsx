import React, { useCallback, useMemo } from 'react'
import { Container } from 'react-bootstrap'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { History } from 'history'

import Table from 'widgets/Table'
import ContextMenuZone from 'widgets/ContextMenuZone'
import { Routes, EXPLORER } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

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
    label: 'addresses.balance',
    key: 'balance',
  },
  {
    label: 'addresses.transactions',
    key: 'transactions',
  },
]

const AddressPanel = ({ address, history }: { address: string; history: History }) => {
  const [t] = useTranslation()
  const actionItems = useMemo(
    () => [
      {
        label: t('addresses.actions.copy-address'),
        click: () => {
          window.clipboard.writeText(address)
        },
      },
      {
        label: t('addresses.actions.request-payment'),
        click: () => {
          window.clipboard.writeText(address)
          history.push(`${Routes.Receive}/${address}`)
        },
      },
      {
        label: t('addresses.actions.spend-from'),
        click: () => {
          window.clipboard.writeText(address)
          history.push(`${Routes.Send}/${address}`)
        },
      },
      {
        label: t('addresses.actions.view-on-explorer'),
        click: () => {
          window.clipboard.writeText(address)
          window.open(EXPLORER)
        },
      },
    ],
    [history, address, t],
  )

  return (
    <ContextMenuZone menuItems={actionItems}>
      <span data-menuitem={JSON.stringify({ hash: address })}>{address}</span>
    </ContextMenuZone>
  )
}

const Addresses = ({ history }: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    wallet: {
      addresses: { receiving, change },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const onPageChange = useCallback(() => {}, [])

  const receivingAddresses = useMemo(
    () =>
      receiving.map(address => ({
        type: 'Receiving',
        address: <AddressPanel address={address} history={history} />,
        balance: '0',
        transactions: '0',
        key: address,
      })),
    [receiving, history],
  )

  const changeAddresses = useMemo(
    () =>
      change.map(address => ({
        type: 'Change',
        address: <AddressPanel address={address} history={history} />,
        balance: '0',
        transactions: '0',
        key: address,
      })),
    [change, history],
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
