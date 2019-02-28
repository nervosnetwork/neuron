import React, { useState, useContext, useEffect } from 'react'
import { Container, Table } from 'react-bootstrap'
import ChainContext, { Transaction } from '../../contexts/Chain'
import { getTransactions } from '../../services/UILayer'

interface ColProps {
  label: string
  index: string
  width?: string
  align?: 'left' | 'center' | 'right' | 'justify' | 'char'
}

interface TxHistory {
  [index: string]: string | number
}

const cols: ColProps[] = [
  {
    label: 'Date',
    index: 'date',
    width: '200px',
  },
  {
    label: 'Amount(ckb)',
    index: 'value',
    width: '200px',
    align: 'right',
  },
  {
    label: 'Transaction hash',
    index: 'hash',
  },
]

const formatterDate = (time: Date) => {
  const date = new Date(time)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d} ${date.toTimeString().substr(0, 8)}`
}

const transactionsToHistory = (transactions: Transaction[]) =>
  transactions.map((tx: Transaction) => ({
    ...tx,
    date: formatterDate(tx.date),
  }))

const History = () => {
  const pageSize = 14
  const initTransactions: TxHistory[] = []

  const chain = useContext(ChainContext)
  const [page, setPage] = useState(0)
  const [items, setItems] = useState(initTransactions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // This should be moved to the top level
    getTransactions(page, pageSize)
  }, [page])

  useEffect(() => {
    const newItems = transactionsToHistory(chain.transactions.items)
    setItems(page === 0 ? newItems : items.concat(newItems))
    setLoading(false)
  }, [chain])

  const onMore = () => {
    const element = document.getElementById('root') as HTMLElement
    const scrollBottom = element.scrollHeight - element.offsetHeight - element.scrollTop
    if (scrollBottom < element.offsetHeight && !loading && items.length < chain.transactions.count) {
      setLoading(true)
      setPage(page + 1)
    }
  }

  return (
    <Container fluid>
      <h1>History</h1>
      <Table striped bordered onWheel={onMore}>
        <thead>
          <tr>
            {cols.map(col => (
              <th key={col.index}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(txHistory => (
            <tr key={txHistory.hash}>
              {cols.map(col => (
                <td
                  style={{
                    width: col.width,
                  }}
                  align={col.align}
                  key={col.index}
                >
                  {txHistory[col.index]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      {loading ? <p>loading...</p> : <div />}
    </Container>
  )
}

export default History
