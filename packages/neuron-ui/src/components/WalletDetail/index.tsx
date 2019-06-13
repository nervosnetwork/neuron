import React from 'react'
import { Card, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'
import TransactionList from 'components/TransactionList'
import { useNeuronWallet } from 'utils/hooks'
import { currencyFormatter } from 'utils/formatters'
import { Routes } from 'utils/const'

const LIST_COUNT = 5

const WalletDetail: React.SFC<React.PropsWithoutRef<ContentProps>> = () => {
  const {
    wallet,
    chain: {
      transactions: { items, totalCount },
    },
  } = useNeuronWallet()
  const [t] = useTranslation()

  return wallet.name ? (
    <Card>
      <Card.Header>{wallet.name}</Card.Header>
      <Card.Body>
        {`Balance: ${currencyFormatter(wallet.balance)}(${currencyFormatter(wallet.balance, 'CNY')})`}
        <h5>{t('siderbar.history')}</h5>
        {totalCount ? (
          <TransactionList items={items.slice(0, LIST_COUNT)} />
        ) : (
          <div>{t('messages.no-transactions')}</div>
        )}
        {totalCount > LIST_COUNT ? (
          <Link className="btn btn-primary" to={Routes.History}>
            {t('detail.more-transactions')}
          </Link>
        ) : null}
      </Card.Body>
    </Card>
  ) : (
    <Alert variant="warning">{t('messages.no-wallet')}</Alert>
  )
}

export default WalletDetail
