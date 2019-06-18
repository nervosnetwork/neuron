import React from 'react'
import { NavLink, RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import TransactionList from 'components/TransactionList'
import Pagination from 'widgets/Table/Pagination'

import { ContentProps } from 'containers/MainContent'
import { Search as SearchIcon } from 'grommet-icons'

import { useNeuronWallet } from 'utils/hooks'
import { queryFormatter } from 'utils/formatters'
import { Routes } from 'utils/const'

import { useSearch, useOnChangePage } from './hooks'

const History = ({
  location: { search, pathname },
  history,
  errorMsgs,
  dispatch,
  providerDispatch,
}: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain: {
      transactions: { pageNo, pageSize, totalCount, items },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const { keywords, onKeywordsChange } = useSearch(search, dispatch, providerDispatch)

  const onPageChange = useOnChangePage(search, pathname, history, queryFormatter)

  return (
    <Container>
      <h1>{t('navbar.history')}</h1>
      {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transactions}`)}</Alert> : null}
      <div style={{ display: 'flex' }}>
        <input type="text" alt="search" value={keywords} onChange={onKeywordsChange} />
        <NavLink to={`${Routes.History}?keywords=${keywords}`}>
          <SearchIcon />
        </NavLink>
      </div>
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
