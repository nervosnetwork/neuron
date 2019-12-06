import React from 'react'
import { storiesOf } from '@storybook/react'
import TransactionList from 'components/TransactionList'
import transactions from './data/transactions'

const stories = storiesOf('TransactionList', module)
Object.entries(transactions).forEach(([title, list]) => {
  stories.add(title, () => (
    <TransactionList isMainnet isLoading={false} tipBlockNumber="123" walletID="1" items={list} dispatch={() => {}} />
  ))
})

stories.add('Wtih empty pending list', () => (
  <TransactionList
    isMainnet
    isLoading={false}
    tipBlockNumber="123"
    walletID="1"
    items={transactions['Content List'].filter(item => item.status !== 'pending')}
    dispatch={() => {}}
  />
))

stories.add('Shimmered List', () => {
  return (
    <TransactionList isMainnet isLoading={false} tipBlockNumber="123" walletID="1" items={[]} dispatch={() => {}} />
  )
})
