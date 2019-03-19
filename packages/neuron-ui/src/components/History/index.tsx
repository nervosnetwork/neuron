import React, { useContext, useCallback } from 'react'
import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Table from '../../widgets/Table'
import ChainContext, { Transaction } from '../../contexts/Chain'
import { getTransactions } from '../../services/UILayer'

const headers = [
  {
    label: 'date',
    key: 'date',
  },
  {
    label: 'amount(ckb)',
    key: 'value',
  },
  {
    label: 'transaction hash',
    key: 'hash',
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
    key: tx.hash,
    date: formatterDate(tx.date),
  }))

const History = () => {
  const chain = useContext(ChainContext)
  const [t] = useTranslation()
  const { pageNo, pageSize, totalCount, items } = chain.transactions
  const onPageChange = useCallback((page: number) => {
    getTransactions(page, pageSize)
  }, [])

  return (
    <Container>
      <h1>{t('Siderbar.History')}</h1>
      <Table
        headers={headers.map(header => ({
          ...header,
          label: t(header.label),
        }))}
        items={transactionsToHistory(items)}
        pageNo={pageNo}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </Container>
  )
}

export default History
