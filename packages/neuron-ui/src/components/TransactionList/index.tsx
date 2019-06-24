import React from 'react'
import styled from 'styled-components'
import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import DescriptionField from 'widgets/InlineInput/DescriptionField'
import { appCalls } from 'services/UILayer'
import { Transaction } from 'contexts/NeuronWallet'
import { TransactionType } from 'utils/const'
import { useLocalDescription } from 'utils/hooks'
import { MainDispatch } from 'containers/MainContent/reducer'

const timeFormatter = new Intl.DateTimeFormat('en-GB')

const headers = [
  { label: 'history.meta', key: 'meta' },
  { label: 'history.transaction-hash', key: 'hash' },
  { label: 'history.description', key: 'description' },
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
    if (timeFormatter.format(cur.timestamp) === timeFormatter.format(lastGroup[0].timestamp)) {
      lastGroup.push(cur)
      return acc
    }
    acc.push([cur])
    return acc
  }, [])
}

const TransactionList = ({ items, dispatch }: { items: Transaction[]; dispatch: MainDispatch }) => {
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'transaction',
    items.map(({ hash: key, description }) => ({
      key,
      description,
    })),
    dispatch
  )

  return (
    <>
      {groupHistory(items).map(group => (
        <Table key={timeFormatter.format(group[0].timestamp)} striped>
          <thead>
            <tr>
              <th colSpan={headers.length}>{timeFormatter.format(group[0].timestamp)}</th>
            </tr>
          </thead>
          <tbody>
            {group.map(historyItem => (
              <tr
                key={historyItem.hash}
                onContextMenu={() => appCalls.contextMenu({ type: 'transactionList', id: historyItem.hash })}
              >
                {headers.map(header => {
                  if (header.key === 'meta') {
                    return (
                      <MetaData key={headers[0].key}>
                        {t(`history.${TransactionType[historyItem.type]}`.toLowerCase())}
                        {timeFormatter.format(historyItem.timestamp)}
                      </MetaData>
                    )
                  }
                  if (header.key === 'description') {
                    const idx = items.findIndex(item => item.hash === historyItem.hash)
                    return (
                      <DescriptionField
                        type="text"
                        title={historyItem.description}
                        value={localDescription[idx]}
                        onKeyPress={onDescriptionPress(idx)}
                        onBlur={onDescriptionFieldBlur(idx)}
                        onChange={onDescriptionChange(idx)}
                      />
                    )
                  }
                  return <td key={header.key}>{historyItem[header.key as keyof Transaction]}</td>
                })}
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
