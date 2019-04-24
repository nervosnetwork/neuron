import React, { useCallback } from 'react'
import { Container } from 'react-bootstrap'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { History } from 'history'
import { Routes, EXPLORER } from 'utils/const'
import Table from 'widgets/Table'
import ContextMenuZone from 'widgets/ContextMenuZone'
import { mockAddresses } from './mock'

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

const generateHDAddresses = () => {
  // TODO: generate 20 hd addresses
  return mockAddresses
}

const getBalanceForAddress = (address: string) => {
  // TODO: fetch balance of the address
  return address.length
}

const getTransactionsForAddress = (address: string) => {
  // TODO: fetch transaction count of the address
  return address.length
}

const AddressPanel = ({ address, history }: { address: string; history: History }) => {
  const [t] = useTranslation()
  const actionItems = [
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
        // TODO: navigate to send page with address
      },
    },
    {
      label: t('addresses.actions.view-on-explorer'),
      click: () => {
        window.clipboard.writeText(address)
        window.open(EXPLORER)
      },
    },
  ]
  return (
    <ContextMenuZone menuItems={actionItems}>
      <span data-menuitem={JSON.stringify({ hash: address })}>{address}</span>
    </ContextMenuZone>
  )
}

const fetchHDAddresses = (history: History) => {
  const addresses = generateHDAddresses().map(address => ({
    type: address.type,
    address: <AddressPanel address={address.address} history={history} />,
    balance: getBalanceForAddress(address.address),
    transactions: getTransactionsForAddress(address.address),
    key: address.address,
  }))
  return addresses
}

const Addresses = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const [t] = useTranslation()
  const [pageNo, pageSize, totalCount] = [0, 20, 20]
  const onPageChange = useCallback(() => {}, [])
  const { history } = props

  return (
    <Container>
      <h2>{t('addresses.addresses')}</h2>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={fetchHDAddresses(history)}
        pageNo={pageNo}
        pageSize={pageSize}
        totalCount={totalCount}
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
