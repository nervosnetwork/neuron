import React, { useContext, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Badge, Table, Dropdown, Alert } from 'react-bootstrap'
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

const MetaData = styled.td`
  display: flex;
  flex-direction: column;
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

const HistoryItemActions = ({ history }: { history: Transaction }) => (
  <td>
    <Dropdown>
      <Dropdown.Toggle variant="outline-dark" id={history.hash} />
      <Dropdown.Menu>
        <DropdownItem to={`/transaction/${history.hash}`}>{i18n.t('history.detail')}</DropdownItem>
        <Dropdown.Item href={EXPLORER} target="_blank">
          {i18n.t('history.explorer')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  </td>
)

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
  {
    label: 'history.more-actions',
    key: 'actions',
  },
]

const queryGen = (params: { [index: string]: any }) => {
  const newQuery = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    newQuery.set(key, `${value}`)
  })
  return newQuery
}

const groupHistory = (items: Transaction[]) => {
  return items.reduce((acc: Transaction[][], cur: Transaction) => {
    if (!acc.length) {
      acc.push([cur])
      return acc
    }
    const lastGroup = acc[acc.length - 1]
    if (dateFormatter(cur.date).date === dateFormatter(lastGroup[0].date).date) {
      lastGroup.push(cur)
      return acc
    }
    acc.push([cur])
    return acc
  }, [])
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
      {groupHistory(items).map(group => (
        <Table key={dateFormatter(group[0].date).date} striped>
          <thead>
            <tr>
              <th colSpan={headers.length}>{dateFormatter(group[0].date).date}</th>
            </tr>
          </thead>
          <tbody>
            {group.map((historyItem: Transaction) => (
              <tr key={historyItem.hash}>
                {headers.map(header => {
                  if (header.key === headers[0].key)
                    return (
                      <MetaData key={headers[0].key}>
                        <span>{t(`history.${TransactionType[historyItem.type]}`.toLowerCase())}</span>
                        <span>{dateFormatter(historyItem.date).date}</span>
                      </MetaData>
                    )
                  if (header.key === headers[headers.length - 1].key)
                    return <HistoryItemActions key={headers[headers.length - 1].key} history={historyItem} />
                  return <td key={header.key}>{historyItem[header.key as keyof Transaction]}</td>
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      ))}
      <Row>
        <Col>
          <Pagination currentPage={pageNo} pageSize={pageSize} total={totalCount} onChange={onPageChange} />
        </Col>
      </Row>
    </Container>
  )
}

export default History
