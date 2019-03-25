import React, { useContext, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Badge, ListGroup, ListGroupItem, Dropdown, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Close as CloseIcon } from 'grommet-icons'

import Pagination from '../../widgets/Table/Pagination'

import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import { ProviderActions } from '../../containers/Providers/reducer'

import ChainContext, { Transaction } from '../../contexts/Chain'
import { queryParsers } from '../../utils/parser'
import { TransactionType, EXPLORER } from '../../utils/const'
import { dateFormatter } from '../../utils/formatters'
import i18n from '../../utils/i18n'

const TimeHeader = styled(ListGroupItem)`
  background-color: #eee;
`

const AddressBadge = styled(Badge)`
  margin-right: 15px;
  margin-bottom: 15px;
`

const DropdownItem = styled(Link).attrs({
  className: 'dropdown-item',
})`
  cursor: initial;
`

const headers = [
  {
    label: 'history.meta',
    key: 'meta',
  },
  {
    label: 'history.transaction-hash',
    key: 'hash',
  },
  {
    label: 'history.amount',
    key: 'value',
  },
]

const queryGen = (params: { [index: string]: any }) => {
  const newQuery = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    newQuery.set(key, `${value}`)
  })
  return newQuery
}

const transactionsToHistory = (transactions: Transaction[]) =>
  transactions.map((tx: Transaction) => {
    const { date, time } = dateFormatter(tx.date)
    return {
      ...tx,
      meta: (
        <>
          <div>{i18n.t(`history.${TransactionType[tx.type as TransactionType]}`.toLowerCase())}</div>
          <div>{time}</div>
        </>
      ),
      key: tx.hash,
      date,
    }
  })

const groupHistory = (items: Transaction[]) => {
  const listItems: JSX.Element[] = []
  transactionsToHistory(items).reduce((acc: string | null, cur) => {
    if (cur.date !== acc) {
      listItems.push(<TimeHeader key={cur.date}>{cur.date}</TimeHeader>)
    }
    listItems.push(
      <ListGroup.Item key={cur.hash}>
        <Container>
          <Row>
            {headers.map(header => (
              <Col key={header.key}>{cur[header.key as keyof typeof cur]}</Col>
            ))}
            <Col>
              <Dropdown>
                <Dropdown.Toggle variant="light" id={cur.hash} />
                <Dropdown.Menu>
                  <DropdownItem to={`/transaction/${cur.hash}`}>Detail</DropdownItem>
                  <Dropdown.Item href={EXPLORER} target="_blank">
                    Explorer
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Container>
      </ListGroup.Item>,
    )
    return cur.date
  }, null)
  return listItems
}

const History = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const { location, history, loadings, errorMsgs, dispatch, providerDispatch } = props
  const chain = useContext(ChainContext)
  const { pageNo, pageSize, totalCount, items, addresses } = chain.transactions

  const [t] = useTranslation()

  const onPageChange = useCallback(
    (page: number) => {
      const params = queryParsers.history(location.search)
      params.pageNo = page
      const newQuery = queryGen(params)
      history.push(`${location.pathname}?${newQuery.toString()}`)
    },
    [location.search],
  )

  const onAddressRemove = useCallback(
    (address: string) => () => {
      const params = queryParsers.history(location.search)
      params.addresses = params.addresses.filter((addr: string) => addr !== address)
      const newQuery = queryGen(params)
      history.push(`${location.pathname}?${newQuery.toString()}`)
    },
    [location.search],
  )

  useEffect(() => {
    const params = queryParsers.history(location.search)
    providerDispatch({
      type: ProviderActions.CleanTransactions,
    })
    dispatch(actionCreators.getTransactions(params))
    return () => {
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transactions: '',
        },
      })
    }
  }, [location.search])

  if (loadings.transactions) {
    return <div>Loading</div>
  }

  return (
    <Container>
      <h1>{t('siderbar.history')}</h1>
      {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transactions}`)}</Alert> : null}
      {addresses.map((address: string) => (
        <AddressBadge variant="primary" key={address}>
          {address}
          <CloseIcon size="small" color="#fff" onClick={onAddressRemove(address)} />
        </AddressBadge>
      ))}
      <ListGroup variant="flush">{groupHistory(items).map(item => item)}</ListGroup>
      <Row>
        <Col>
          <Pagination currentPage={pageNo} pageSize={pageSize} total={totalCount} onChange={onPageChange} />
        </Col>
      </Row>
    </Container>
  )
}

export default History
