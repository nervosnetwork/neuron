import React, { useContext, useEffect, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Badge, Table, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Close as CloseIcon } from 'grommet-icons'

import ContextMenuZone from '../../widgets/ContextMenuZone'
import Pagination from '../../widgets/Table/Pagination'

import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import { ProviderActions } from '../../containers/Providers/reducer'

import ChainContext, { Transaction } from '../../contexts/Chain'
import { queryParsers } from '../../utils/parser'
import { TransactionType, EXPLORER } from '../../utils/const'
import { dateFormatter, queryFormatter } from '../../utils/formatters'

const MetaData = styled.td`
  display: flex;
  flex-direction: column;
`

const AddressBadge = styled(Badge)`
  margin-right: 15px;
  margin-bottom: 15px;
`

const headers = [
  { label: 'history.meta', key: 'meta' },
  { label: 'history.transaction-hash', key: 'hash' },
  { label: 'history.amount', key: 'value' },
]

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
  const {
    location: { search, pathname },
    history,
    loadings,
    errorMsgs,
    dispatch,
    providerDispatch,
  } = props
  const chain = useContext(ChainContext)
  const [t] = useTranslation()
  const { pageNo, pageSize, totalCount, items, addresses } = chain.transactions

  useEffect(() => {
    const params = queryParsers.history(search)
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
  }, [search])

  const menuItems = useMemo(() => {
    return [
      {
        label: t('history.detail'),
        click: (params: { hash: string }) => () => {
          history.push(`/transaction/${params.hash}`)
        },
      },
      {
        label: t('history.explorer'),
        click: () => () => {
          window.open(EXPLORER)
        },
      },
    ]
  }, [])

  const onPageChange = useCallback(
    (page: number) => {
      const params = queryParsers.history(search)
      params.pageNo = page
      const newQuery = queryFormatter(params)
      history.push(`${pathname}?${newQuery.toString()}`)
    },
    [search],
  )

  const onAddressRemove = useCallback(
    (address: string) => () => {
      const params = queryParsers.history(search)
      params.addresses = params.addresses.filter((addr: string) => addr !== address)
      const newQuery = queryFormatter(params)
      history.push(`${pathname}?${newQuery.toString()}`)
    },
    [search],
  )

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
      <ContextMenuZone menuItems={menuItems}>
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
                          <span data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                            {t(`history.${TransactionType[historyItem.type]}`.toLowerCase())}
                          </span>
                          <span data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                            {dateFormatter(historyItem.date).date}
                          </span>
                        </MetaData>
                      )
                    return (
                      <td key={header.key} data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                        {historyItem[header.key as keyof Transaction]}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        ))}
      </ContextMenuZone>
      <Row>
        <Col>
          <Pagination currentPage={pageNo} pageSize={pageSize} total={totalCount} onChange={onPageChange} />
        </Col>
      </Row>
    </Container>
  )
}

export default History
