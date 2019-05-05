import React, { useCallback } from 'react'
import { Container } from 'react-bootstrap'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { History } from 'history'
import { Routes, EXPLORER } from 'utils/const'
import Table from 'widgets/Table'
import ContextMenuZone from 'widgets/ContextMenuZone'
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

const Addresses = (props: React.PropsWithoutRef<RouteComponentProps>) => {
  const {
    wallet: { addresses },
  } = useNeuronWallet()
  const [t] = useTranslation()
  const [pageNo, pageSize, totalCount] = [0, 20, 20]
  const onPageChange = useCallback(() => {}, [])
  const { history } = props

  const receivingAddresses = addresses.receiving.map(address => ({
    type: 'Receiving',
    address: <AddressPanel address={address} history={history} />,
    balance: '0',
    transactions: '0',
    key: address,
  }))

  const changeAddresses = addresses.change.map(address => ({
    type: 'Change',
    address: <AddressPanel address={address} history={history} />,
    balance: '0',
    transactions: '0',
    key: address,
  }))

  return (
    <Container>
      <h2>{t('addresses.addresses')}</h2>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={[...changeAddresses, ...receivingAddresses]}
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
