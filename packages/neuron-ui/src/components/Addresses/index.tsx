import React, { useCallback } from 'react'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import Table from '../../widgets/Table'
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

const fetchHDAddresses = () => {
  const addresses = generateHDAddresses().map(address => ({
    ...address,
    balance: getBalanceForAddress(address.address),
    transactions: getTransactionsForAddress(address.address),
    key: address.address,
  }))
  return addresses
}

export default () => {
  const [t] = useTranslation()
  const [pageNo, pageSize, totalCount] = [0, 20, 20]
  const onPageChange = useCallback(() => {}, [])

  return (
    <Container>
      <h2>{t('addresses.addresses')}</h2>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={fetchHDAddresses()}
        pageNo={pageNo}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </Container>
  )
}
