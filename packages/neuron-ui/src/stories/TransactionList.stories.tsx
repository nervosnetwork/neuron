import React from 'react'
import { storiesOf } from '@storybook/react'
import TransactionList from 'components/TransactionList'
import transactions from './data/transactions'

const stories = storiesOf('TransactionList', module)
Object.entries(transactions).forEach(([title, list]) => {
  stories.add(title, () => (
    <TransactionList
      isMainnet
      bestKnownBlockNumber={123}
      walletID="1"
      walletName="wallet name"
      items={list}
      dispatch={() => {}}
    />
  ))
})

stories.add('With empty pending list', () => (
  <TransactionList
    isMainnet
    bestKnownBlockNumber={123}
    walletID="1"
    walletName="wallet name"
    items={transactions['Content List'].filter(item => item.status !== 'pending')}
    dispatch={() => {}}
  />
))

stories.add('Shimmered List', () => {
  return (
    <TransactionList
      isMainnet
      bestKnownBlockNumber={123}
      walletID="1"
      walletName="wallet name"
      items={[]}
      dispatch={() => {}}
    />
  )
})
