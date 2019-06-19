import React from 'react'
import styled from 'styled-components'
import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { appCalls } from 'services/UILayer'
import { Transaction } from 'contexts/NeuronWallet'
import { TransactionType } from 'utils/const'

const timeFormatter = new Intl.DateTimeFormat('en-GB')

const headers = [
  { label: 'history.meta', key: 'meta' },
  { label: 'history.transaction-hash', key: 'hash' },
  { label: 'history.amount', key: 'value' },
]

const MetaData = styled.td`
  display: flex;
  flex-direction: column;
`

const groupHistory = (items: Transaction[]): Transaction[][] => {
  return items.reduce((acc: Transaction[][], cur: Transaction) => {
    if (!acc.length) {
      acc.push([cur])
      return acc
    }
    const lastGroup = acc[acc.length - 1]
    if (timeFormatter.format(cur.time) === timeFormatter.format(lastGroup[0].time)) {
      lastGroup.push(cur)
      return acc
    }
    acc.push([cur])
    return acc
  }, [])
}

const TransactionList = ({ items }: { items: Transaction[] }) => {
  const [t] = useTranslation()
  return (
    <>
      {groupHistory(items).map(group => (
        <Table key={timeFormatter.format(group[0].time)} striped>
          <thead>
            <tr>
              <th colSpan={headers.length}>{timeFormatter.format(group[0].time)}</th>
            </tr>
          </thead>
          <tbody>
            {group.map(historyItem => (
              <tr
                key={historyItem.hash}
                onContextMenu={() => appCalls.contextMenu({ type: 'transactionList', id: historyItem.hash })}
              >
                {headers.map(header =>
                  header.key === headers[0].key ? (
                    <MetaData key={headers[0].key}>
                      {t(`history.${TransactionType[historyItem.type]}`.toLowerCase())}
                      {timeFormatter.format(historyItem.time)}
                    </MetaData>
                  ) : (
                    <td key={header.key}>{historyItem[header.key as keyof Transaction]}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      ))}
    </>
  )
}

TransactionList.displayName = 'TransactionList'

export default TransactionList
