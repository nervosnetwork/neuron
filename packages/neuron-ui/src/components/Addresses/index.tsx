import React, { useCallback } from 'react'
import { Container } from 'react-bootstrap'
import styled from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Table from '../../widgets/Table'
import Dropdown from '../../widgets/Dropdown'
import { Routes } from '../../utils/const'
import { mockAddresses } from './mock'

declare global {
  interface Window {
    clipboard: any
  }
}

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

const Popover = styled.div`
  position: relative;
  &:hover {
    & > ul {
      display: block !important;
    }
  }
`
const AddressPanel = ({ address, history }: { address: string; history: any }) => {
  const [t] = useTranslation()
  const actionItems = [
    {
      label: t('addresses.actions.copyaddress'),
      onClick: () => {
        window.clipboard.writeText(address)
      },
      disabled: false,
    },
    {
      label: t('addresses.actions.requestpayment'),
      onClick: () => {
        history.push(`${Routes.Receive}/${address}`)
      },
      disabled: false,
    },
    {
      label: t('addresses.actions.spendfrom'),
      onClick: () => {
        // TODO: navigate to send page with address
      },
      disabled: false,
    },
    {
      label: t('addresses.actions.viewonexplorer'),
      onClick: () => {
        // TODO: view on ckb explorer
      },
      disabled: false,
    },
  ]
  return (
    <Popover>
      <div>{address}</div>
      <Dropdown
        items={actionItems}
        style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          zIndex: '999',
          display: 'none',
        }}
        itemsStyle={{
          textTransform: 'capitalize',
          boxShadow: '0px 1px 3px rgb(120, 120, 120)',
        }}
      />
    </Popover>
  )
}

const fetchHDAddresses = (history: any) => {
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
      />
    </Container>
  )
}

export default Addresses
