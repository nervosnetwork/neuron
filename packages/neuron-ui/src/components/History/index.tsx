import React from 'react'
import styled from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Badge, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Close as CloseIcon } from 'grommet-icons'

import TransactionList from 'components/TransactionList'
import Pagination from 'widgets/Table/Pagination'

import { ContentProps } from 'containers/MainContent'

import { useNeuronWallet } from 'utils/hooks'
import { queryFormatter } from 'utils/formatters'

import { useSearch, useOnChangePage, useOnAddressRemove } from './hooks'

const AddressBadge = styled(Badge)`
  margin-right: 15px;
  margin-bottom: 15px;
`

const History = ({
  location: { search, pathname },
  history,
  errorMsgs,
  dispatch,
  providerDispatch,
}: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain: {
      transactions: { pageNo, pageSize, totalCount, items, addresses },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  useSearch(search, dispatch, providerDispatch)

  const onPageChange = useOnChangePage(search, pathname, history, queryFormatter)
  const onAddressRemove = useOnAddressRemove(search, pathname, history, queryFormatter)

  return (
    <Container>
      <h1>{t('siderbar.history')}</h1>
      {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transactions}`)}</Alert> : null}
      {addresses.length > 0 ? (
        addresses.map(address => (
          <AddressBadge variant="primary" key={address}>
            {address}
            <CloseIcon size="small" color="#fff" onClick={onAddressRemove(address)} />
          </AddressBadge>
        ))
      ) : (
        <div>{t('messages.no-transactions')}</div>
      )}
      <TransactionList items={items} />
      {totalCount > pageSize ? (
        <Row>
          <Col>
            <Pagination currentPage={pageNo - 1} pageSize={pageSize} total={totalCount} onChange={onPageChange} />
          </Col>
        </Row>
      ) : null}
    </Container>
  )
}

export default History
