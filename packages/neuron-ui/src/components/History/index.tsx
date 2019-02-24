import React, { useState, useContext, useEffect } from 'react'
import { DataTable, Text } from 'grommet'
import styled from 'styled-components'
import TablePagination from './tablePagination'

import ChainContext, { Transaction } from '../../contexts/Chain'

import ipc from '../../utils/ipc'

const FooterDiv = styled.div`
  height: 80px;
`

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
  const chain = useContext(ChainContext)
  const pageSize = 14
  const [page, setPage] = useState(0)
  const total = 200

  useEffect(() => {
    // This should be moved to the top level
    ipc.getHistory(page, pageSize)
  }, [page, pageSize])

  return (
    <div>
      <h1>History</h1>
      <DataTable
        id="list"
        columns={[
          {
            header: 'Date',
            property: 'date',
            align: 'start',
            render: (transaction: Transaction) => <Text>{transaction.date}</Text>,
          },
          {
            header: 'Amount (CKB)',
            property: 'value',
            align: 'start',
            render: (transaction: Transaction) => <Text>{transaction.value}</Text>,
          },
          {
            header: 'Transaction Hash',
            property: 'hash',
            align: 'start',
            render: (transaction: Transaction) => <Text>{transaction.hash}</Text>,
          },
        ]}
        data={transactionsToHistory(chain.transactions)}
        margin={{
          bottom: 'xsmall',
        }}
      />
      <FooterDiv>
        <TablePagination page={page} pageSize={pageSize} total={total} onChange={idx => setPage(idx)} />
      </FooterDiv>
    </div>
  )
}

export default History
