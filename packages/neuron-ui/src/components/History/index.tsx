import React, { useState, useEffect } from 'react'
import { DataTable, Text } from 'grommet'
import { Transaction } from 'grommet-icons'
import styled from 'styled-components'
import TablePagination from './tablePagination'

interface Transaction {
  date: string
  value: number
  hash: string
}

const FooterDiv = styled.div`
  height: 80px;
`

const formatterDate = (date: Date) => {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d} ${date.toTimeString().substr(0, 8)}`
}

const requestHistory = (_typeHash: string, page: number, pageSize: number) => {
  const list = []
  for (let i = 0; i < pageSize; i += 1) {
    const num = pageSize * page + i
    const date = new Date(new Date().getTime() - num * 1000 * 3600)
    list.push({
      date: formatterDate(date),
      value: 300.34 + num,
      hash: `0x37cc18636c632fd8ad0d0682b33a1dff8c2b621be29e82403c898cecabb2ec9e${num.toString()}`,
    })
  }
  return list
}

const History = () => {
  const walletAddress = '0x22f5Bd068FE2F7bEd72D8c9c8CC22e872AD48Bb9'
  const pageSize = 14
  const [page, setPage] = useState(0)
  const [list, setList] = useState(requestHistory(walletAddress, page, pageSize))
  const total = 200

  useEffect(() => {
    setList(requestHistory(walletAddress, page, pageSize))
  }, [page])

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
        data={list}
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
