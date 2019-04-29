import React from 'react'
import styled from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { Container, Row, Col, Badge, Table, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { Close as CloseIcon } from 'grommet-icons'
import dayjs from 'dayjs'

import ContextMenuZone from 'widgets/ContextMenuZone'
import Pagination from 'widgets/Table/Pagination'

import { ContentProps } from 'containers/MainContent'

import { Transaction } from 'contexts/NeuronWallet'
import { useNeuronWallet } from 'utils/hooks'
import { TransactionType, EXPLORER } from 'utils/const'
import { queryFormatter } from 'utils/formatters'

import { useSearch, useMenuItems, useOnChangePage, useOnAddressRemove } from './hooks'

enum TimeFormat {
  Day = 'YYYY-MM-DD',
  Time = 'HH:mm',
}

const headers = [
  { label: 'history.meta', key: 'meta' },
  { label: 'history.transaction-hash', key: 'hash' },
  { label: 'history.amount', key: 'value' },
]

export interface MenuItemParams {
  hash: string
}

const MetaData = styled.td`
  display: flex;
  flex-direction: column;
`

const AddressBadge = styled(Badge)`
  margin-right: 15px;
  margin-bottom: 15px;
`

const groupHistory = (items: Transaction[]): Transaction[][] => {
  return items.reduce((acc: Transaction[][], cur: Transaction) => {
    if (!acc.length) {
      acc.push([cur])
      return acc
    }
    const lastGroup = acc[acc.length - 1]
    if (dayjs(cur.time).format(TimeFormat.Day) === dayjs(lastGroup[0].time).format(TimeFormat.Day)) {
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
  const {
    chain: {
      transactions: { pageNo, pageSize, totalCount, items, addresses },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  useSearch(search, dispatch, providerDispatch)

  const menuItems = useMenuItems(t, history, EXPLORER)
  const onPageChange = useOnChangePage(search, pathname, history, queryFormatter)
  const onAddressRemove = useOnAddressRemove(search, pathname, history, queryFormatter)

  if (loadings.transactions) {
    return <div>Loading</div>
  }

  return (
    <Container>
      <h1>{t('siderbar.history')}</h1>
      {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transactions}`)}</Alert> : null}
      {addresses.map(address => (
        <AddressBadge variant="primary" key={address}>
          {address}
          <CloseIcon size="small" color="#fff" onClick={onAddressRemove(address)} />
        </AddressBadge>
      ))}
      <ContextMenuZone menuItems={menuItems}>
        {groupHistory(items).map(group => (
          <Table key={dayjs(group[0].time).format(TimeFormat.Day)} striped>
            <thead>
              <tr>
                <th colSpan={headers.length}>{dayjs(group[0].time).format(TimeFormat.Day)}</th>
              </tr>
            </thead>
            <tbody>
              {group.map(historyItem => (
                <tr key={historyItem.hash}>
                  {headers.map(header =>
                    header.key === headers[0].key ? (
                      <MetaData key={headers[0].key}>
                        <span data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                          {t(`history.${TransactionType[historyItem.type]}`.toLowerCase())}
                        </span>
                        <span data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                          {dayjs(historyItem.time).format(TimeFormat.Time)}
                        </span>
                      </MetaData>
                    ) : (
                      <td key={header.key} data-menuitem={JSON.stringify({ hash: historyItem.hash })}>
                        {historyItem[header.key as keyof Transaction]}
                      </td>
                    ),
                  )}
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
